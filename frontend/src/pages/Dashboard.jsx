import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getSubmissions } from '../api/submissions.js';
import { getNewsletters } from '../api/newsletters.js';
import Loader from '../components/Loader.jsx';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [mySubmissions, setMySubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [subs, newsletters] = await Promise.all([
                    getSubmissions({ userId: user.id }),
                    getNewsletters(),
                ]);
                setMySubs(subs.slice(0, 5));
                setStats({
                    total: subs.length,
                    pending: subs.filter((s) => s.status === 'pending').length,
                    approved: subs.filter((s) => s.status === 'approved').length,
                    newsletters: newsletters.length,
                });
            } catch (err) {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user.id]);

    if (loading) return <Loader text="Loading dashboard..." />;

    const now = new Date();
    const latestNewsletterLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
        .format(new Date(now.getFullYear(), now.getMonth(), 1));

    return (
        <div className="container mt-4">
            <div className="card p-4 mb-4 shadow-sm dashboard-hero-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h4 className="fw-bold mb-1">Welcome back, {user.name}</h4>
                        <p className="text-muted small mb-0 text-capitalize">
                            {user.role} &nbsp;|&nbsp; CSE Department
                        </p>
                        <div className="dashboard-hero-note mt-3">
                            Current issue window: <strong>{latestNewsletterLabel}</strong>
                        </div>
                    </div>
                    <Link to="/submit" className="btn btn-primary">+ New Submission</Link>
                </div>
            </div>

            <div className="row mb-4">
                {[
                    { label: 'Submissions', value: stats?.total, color: 'text-primary' },
                    { label: 'Pending Review', value: stats?.pending, color: 'text-warning' },
                    { label: 'Approved', value: stats?.approved, color: 'text-success' },
                    { label: 'Newsletters', value: stats?.newsletters, color: 'text-info' },
                ].map((s) => (
                    <div className="col-6 col-md-3 mb-3" key={s.label}>
                        <div className="card p-3 text-center shadow-sm h-100">
                            <h3 className={`fw-bold mb-1 ${s.color}`}>{s.value ?? '-'}</h3>
                            <p className="text-muted small mb-0">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <Link to="/submit" className="text-decoration-none">
                        <div className="card p-3 shadow-sm h-100 border-start border-primary border-3">
                            <h6 className="fw-bold">New Submission</h6>
                            <p className="text-muted small mb-0">Add an activity, achievement, visit, or publication.</p>
                        </div>
                    </Link>
                </div>
                <div className="col-md-4 mb-3">
                    <Link to={`/preview/${now.getFullYear()}/${now.getMonth() + 1}`} className="text-decoration-none">
                        <div className="card p-3 shadow-sm h-100 border-start border-warning border-3">
                            <h6 className="fw-bold">Current Issue</h6>
                            <p className="text-muted small mb-0">Preview approved content for this month.</p>
                            <small className="text-warning-emphasis mt-2 d-inline-block">Open live preview</small>
                        </div>
                    </Link>
                </div>
                <div className="col-md-4 mb-3">
                    <Link to="/archive" className="text-decoration-none">
                        <div className="card p-3 shadow-sm h-100 border-start border-info border-3">
                            <h6 className="fw-bold">Archive</h6>
                            <p className="text-muted small mb-0">Browse earlier monthly newsletters.</p>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">My Recent Submissions</h6>
                    <Link to="/archive" className="text-decoration-none small">View archive →</Link>
                </div>
                {mySubmissions.length === 0 ? (
                    <p className="text-muted small text-center py-3">
                        No submissions yet. <Link to="/submit">Submit an update.</Link>
                    </p>
                ) : (
                    <ul className="list-group list-group-flush">
                        {mySubmissions.map((s) => (
                            <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <div className="fw-medium small">{s.title}</div>
                                    <small className="text-muted text-capitalize">
                                        {s.category.replace(/_/g, ' ')}
                                    </small>
                                </div>
                                <span className={`badge ${s.status === 'approved'
                                    ? 'bg-success'
                                    : s.status === 'pending'
                                        ? 'bg-warning text-dark'
                                        : 'bg-danger'
                                }`}
                                >
                                    {s.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
