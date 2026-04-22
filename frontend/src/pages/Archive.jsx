import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNewsletters } from '../api/newsletters.js';
import Loader from '../components/Loader.jsx';
import toast from 'react-hot-toast';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function Archive() {
    const [newsletters, setNewsletters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('all');

    useEffect(() => {
        getNewsletters()
            .then(setNewsletters)
            .catch(() => toast.error('Failed to load archive'))
            .finally(() => setLoading(false));
    }, []);

    const years = [...new Set(newsletters.map((n) => n.year))].sort((a, b) => b - a);
    const filtered = filterYear === 'all'
        ? newsletters
        : newsletters.filter((n) => n.year === parseInt(filterYear, 10));

    if (loading) return <Loader text="Loading archive..." />;

    return (
        <div className="container mt-4">
            <div className="archive-hero mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Newsletter Archive</h4>
                    <p className="text-muted small mb-0">
                        Open monthly issues, revisit published highlights, and browse by year.
                    </p>
                </div>
                <div className="archive-summary-badges">
                    <span className="archive-pill">{newsletters.length} issues</span>
                    <span className="archive-pill">{years.length || 0} years</span>
                </div>
            </div>

            <div className="archive-filter-row mb-4">
                <div className="archive-filter-pills">
                    <button
                        type="button"
                        className={`archive-filter-pill ${filterYear === 'all' ? 'is-active' : ''}`}
                        onClick={() => setFilterYear('all')}
                    >
                        All Years
                    </button>
                    {years.map((year) => (
                        <button
                            key={year}
                            type="button"
                            className={`archive-filter-pill ${filterYear === String(year) ? 'is-active' : ''}`}
                            onClick={() => setFilterYear(String(year))}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                <select
                    className="form-select archive-year-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                >
                    <option value="all">All Years</option>
                    {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="card p-4 text-center text-muted archive-empty-state">
                    No newsletters found for this filter.
                </div>
            ) : (
                <div className="row g-4">
                    {filtered.map((nl) => (
                        <div key={nl.id} className="col-md-4">
                            <Link to={`/preview/${nl.year}/${nl.month}`} className="text-decoration-none">
                                <div className="archive-card h-100">
                                    <div className="archive-card-top">
                                        <div className="archive-card-month">
                                            {nl.month.toString().padStart(2, '0')}
                                        </div>
                                        <div>
                                            <div className="fw-bold">{MONTHS[nl.month]} {nl.year}</div>
                                            <small className="text-muted">{nl.issue || 'CSE Department'}</small>
                                        </div>
                                    </div>

                                    <div className="archive-card-body">
                                        <div className="archive-card-title">Monthly department issue</div>
                                        <p className="archive-card-copy mb-0">
                                            Review the curated newsletter layout and download the latest PDF-ready version.
                                        </p>
                                    </div>

                                    <div className="archive-card-footer">
                                        <span className={`badge ${nl.status === 'published' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                            {nl.status}
                                        </span>
                                        <span className="archive-card-link">Open issue</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
