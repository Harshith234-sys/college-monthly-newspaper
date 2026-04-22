import express from 'express';
import supabase from '../supabase/client.js';
import { mapProfile } from '../supabase/mappers.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role = 'student', rollNumber } = req.body;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role, rollNumber },
        });

        if (authError) return res.status(400).json({ message: authError.message });

        const profilePayload = {
            id: authData.user.id,
            name,
            email,
            role,
            roll_number: rollNumber || null,
        };

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' })
            .select('*')
            .single();

        if (profileError) return res.status(400).json({ message: profileError.message });

        res.status(201).json({ user: mapProfile(profile) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) return res.status(500).json({ message: profileError.message });

        res.json({
            token: authData.session?.access_token,
            user: mapProfile(profile),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

export default router;
