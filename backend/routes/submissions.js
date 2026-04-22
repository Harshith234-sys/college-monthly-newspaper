import express from 'express';
import supabase from '../supabase/client.js';
import { mapSubmission } from '../supabase/mappers.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { isCategoryAllowedForRole } from '../utils/newsletterConfig.js';

const router = express.Router();

const submissionSelect = '*, profile:profiles(id,name,email,role,department,roll_number,is_approved,created_at,updated_at)';

// POST /api/submissions
router.post('/', protect, async (req, res) => {
    try {
        const { title, category, description, images, highlights, month, year } = req.body;

        if (!isCategoryAllowedForRole(req.user.role, category)) {
            return res.status(403).json({ message: `The ${req.user.role} role cannot submit to ${category}.` });
        }

        const { data, error } = await supabase
            .from('submissions')
            .insert({
                title,
                category,
                description,
                images: images || [],
                highlights: highlights || [],
                month,
                year,
                submitted_by: req.user.id,
            })
            .select(submissionSelect)
            .single();

        if (error) return res.status(400).json({ message: error.message });
        res.status(201).json(mapSubmission(data));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/submissions
router.get('/', protect, async (req, res) => {
    try {
        const { month, year, category, status } = req.query;
        let query = supabase
            .from('submissions')
            .select(submissionSelect)
            .order('created_at', { ascending: false });

        if (month) query = query.eq('month', Number(month));
        if (year) query = query.eq('year', Number(year));
        if (category) query = query.eq('category', category);
        if (status) query = query.eq('status', status);
        if (req.user.role !== 'admin') query = query.eq('submitted_by', req.user.id);

        const { data, error } = await query;
        if (error) return res.status(500).json({ message: error.message });
        res.json((data || []).map(mapSubmission));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/submissions/:id
router.get('/:id', protect, async (req, res) => {
    try {
        let query = supabase
            .from('submissions')
            .select(submissionSelect)
            .eq('id', req.params.id);

        if (req.user.role !== 'admin') query = query.eq('submitted_by', req.user.id);

        const { data, error } = await query.single();
        if (error) return res.status(404).json({ message: 'Not found' });
        res.json(mapSubmission(data));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/submissions/:id/status
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status, adminComment } = req.body;

        const { data, error } = await supabase
            .from('submissions')
            .update({ status, admin_comment: adminComment || null })
            .eq('id', req.params.id)
            .select(submissionSelect)
            .single();

        if (error) return res.status(400).json({ message: error.message });
        res.json(mapSubmission(data));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/submissions/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const { data: submission, error: findError } = await supabase
            .from('submissions')
            .select('id, submitted_by')
            .eq('id', req.params.id)
            .single();

        if (findError || !submission) return res.status(404).json({ message: 'Not found' });
        if (submission.submitted_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', req.params.id);

        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
