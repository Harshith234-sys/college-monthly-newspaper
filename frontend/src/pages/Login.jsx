import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function Login() {
    const [tab, setTab] = useState('login');  // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome, ${user.name}!`);
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form.email, form.password, form.name, form.role);
            toast.success('Account created! Check your email to confirm, then log in.');
            setTab('login');
        } catch (err) {
            toast.error(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div style={{ width: '380px' }}>

                {/* Logo */}
                <div className="text-center mb-4">
                    <div
                        className="bg-dark text-warning fw-bold d-flex align-items-center justify-content-center mx-auto mb-2"
                        style={{ width: '60px', height: '60px', borderRadius: '10px', fontSize: '18px' }}
                    >VJ</div>
                    <h4 className="fw-bold mb-0">VNRVJIET</h4>
                    <p className="text-muted small">Department of CSE — Newsletter Platform</p>
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button className={`nav-link ${tab === 'login' ? 'active' : ''}`}
                            onClick={() => setTab('login')}>Sign In</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${tab === 'register' ? 'active' : ''}`}
                            onClick={() => setTab('register')}>Register</button>
                    </li>
                </ul>

                <div className="card p-4 shadow">

                    {/* LOGIN */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" required className="form-control"
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input type="password" required className="form-control"
                                    placeholder="Enter password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <button type="submit" disabled={loading} className="btn btn-primary w-100">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* REGISTER */}
                    {tab === 'register' && (
                        <form onSubmit={handleRegister}>
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input type="text" required className="form-control"
                                    placeholder="e.g. T Sridhar"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" required className="form-control"
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input type="password" required className="form-control"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="btn btn-success w-100">
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                            <p className="text-muted small text-center mt-2 mb-0">
                                Choose admin only for department administrator accounts.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
