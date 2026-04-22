import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);
const PROFILE_TIMEOUT_MS = 10000;

function withTimeout(promise, message) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), PROFILE_TIMEOUT_MS);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function fallbackProfile(authUser) {
    return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: authUser.user_metadata?.role || 'student',
        department: 'CSE',
        roll_number: authUser.user_metadata?.rollNumber || authUser.user_metadata?.roll_number || null,
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // fetch profile row from profiles table
    const fetchProfile = async (authUser) => {
        try {
            const { data, error } = await withTimeout(
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle(),
                'Profile loading timed out'
            );

            if (error) throw error;

            const nextProfile = data || fallbackProfile(authUser);
            setProfile(nextProfile);
            return nextProfile;
        } catch (err) {
            console.warn('Profile load failed:', err.message);
            const nextProfile = fallbackProfile(authUser);
            setProfile(nextProfile);
            return nextProfile;
        }
    };

    useEffect(() => {
        let mounted = true;

        // check existing session
        const loadSession = async () => {
            try {
                const { data: { session } } = await withTimeout(
                    supabase.auth.getSession(),
                    'Session loading timed out'
                );

                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user);
                }
            } catch (err) {
                console.warn('Session load failed:', err.message);
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadSession();

        // listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const prof = await fetchProfile(data.user);
        return { ...data.user, ...prof };
    };

    const register = async (email, password, name, role = 'student') => {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { name, role } },
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    // merged object pages can use as before: user.name, user.role etc.
    const mergedUser = user && profile
        ? { ...profile, email: user.email, authId: user.id }
        : null;

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user: mergedUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
