import express from 'express';
import supabase from '../supabase/client.js';
import { mapNewsletter, mapSubmission } from '../supabase/mappers.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

const submissionSelect = '*, profile:profiles(id,name,email,role,department,roll_number,is_approved,created_at,updated_at)';

// POST /api/newsletters
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { month, year, title, issue, editorialBoard, bannerImageUrl } = req.body;

        const { data, error } = await supabase
            .from('newsletters')
            .upsert({
                month,
                year,
                title,
                issue,
                editorial_board: editorialBoard || [],
                banner_image_url: bannerImageUrl || null,
            }, { onConflict: 'month,year' })
            .select('*')
            .single();

        if (error) return res.status(400).json({ message: error.message });
        res.status(201).json(mapNewsletter(data));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/newsletters
router.get('/', async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('newsletters')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) return res.status(500).json({ message: error.message });
        res.json((data || []).map(mapNewsletter));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/newsletters/:year/:month
router.get('/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;

        const { data: newsletter, error: newsletterError } = await supabase
            .from('newsletters')
            .select('*')
            .eq('year', Number(year))
            .eq('month', Number(month))
            .maybeSingle();

        if (newsletterError) return res.status(500).json({ message: newsletterError.message });

        const { data: submissions, error: submissionsError } = await supabase
            .from('submissions')
            .select(submissionSelect)
            .eq('year', Number(year))
            .eq('month', Number(month))
            .eq('status', 'approved')
            .order('category', { ascending: true })
            .order('order', { ascending: true });

        if (submissionsError) return res.status(500).json({ message: submissionsError.message });

        const sections = {};
        (submissions || []).map(mapSubmission).forEach((submission) => {
            if (!sections[submission.category]) sections[submission.category] = [];
            sections[submission.category].push(submission);
        });

        res.json({ newsletter: mapNewsletter(newsletter), sections });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/newsletters/:id/publish
router.post('/:id/publish', protect, adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('newsletters')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error) return res.status(400).json({ message: error.message });
        res.json(mapNewsletter(data));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
