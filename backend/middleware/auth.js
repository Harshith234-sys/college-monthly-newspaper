import supabase from '../supabase/client.js';
import { mapProfile } from '../supabase/mappers.js';

export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authData.user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            return res.status(401).json({ message: 'Profile not found' });
        }

        req.user = mapProfile(profile);
        req.authUser = authData.user;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

export const staffOnly = (req, res, next) => {
    if (!['admin', 'faculty'].includes(req.user?.role)) {
        return res.status(403).json({ message: 'Staff access required' });
    }
    next();
};
