import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
    downloadNewsletterPdf,
    getNewsletterWithSections,
    getRecipientEmailsByRoles,
} from '../api/newsletters.js';
import NewsletterCover from '../components/NewsletterCover.jsx';
import SectionRenderer from '../components/SectionRenderer.jsx';
import Loader from '../components/Loader.jsx';
import { MONTH_NAMES, SECTION_ORDER } from '../constants/newsletter.js';
import toast from 'react-hot-toast';

const AUDIENCE_CONFIG = {
    students: {
        label: 'Email Students',
        roles: ['student', 'club_rep'],
    },
    faculty: {
        label: 'Email Faculty',
        roles: ['faculty'],
    },
    everyone: {
        label: 'Email All',
        roles: ['student', 'club_rep', 'faculty'],
    },
};

function buildMailtoLink({ recipients, subject, body }) {
    const params = new URLSearchParams({
        subject,
        body,
    });

    if (recipients.length) {
        params.set('bcc', recipients.join(','));
    }

    return `mailto:?${params.toString()}`;
}

export default function NewsletterPreview() {
    const { year, month } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [sharingAudience, setSharingAudience] = useState('');

    useEffect(() => {
        setLoading(true);
        getNewsletterWithSections(year, month)
            .then(setData)
            .catch(() => toast.error('Failed to load newsletter'))
            .finally(() => setLoading(false));
    }, [year, month]);

    const downloadPDF = async () => {
        setDownloading(true);
        try {
            await downloadNewsletterPdf(year, month);
            toast.success('PDF download started');
        } catch (error) {
            toast.error(error.message || 'Could not generate the PDF');
        } finally {
            setDownloading(false);
        }
    };

    const handleEmailShare = async (audienceKey) => {
        const audience = AUDIENCE_CONFIG[audienceKey];
        if (!audience) return;

        setSharingAudience(audienceKey);
        try {
            const recipients = await getRecipientEmailsByRoles(audience.roles);
            if (!recipients.length) {
                toast.error(`No ${audienceKey} email recipients found`);
                return;
            }

            const newsletter = data?.newsletter;
            const issueLabel = newsletter?.issue ? ` (${newsletter.issue})` : '';
            const previewUrl = `${window.location.origin}/preview/${year}/${month}`;
            const subject = `${MONTH_NAMES[Number(month)]} ${year} Newsletter${issueLabel}`;
            const body = [
                `Please find the ${MONTH_NAMES[Number(month)]} ${year} newsletter attached/shared below.`,
                '',
                `Preview link: ${previewUrl}`,
                '',
                'Regards,',
                'Department of CSE',
            ].join('\n');

            window.location.href = buildMailtoLink({ recipients, subject, body });
        } catch (error) {
            toast.error(error.message || 'Could not prepare the email');
        } finally {
            setSharingAudience('');
        }
    };

    if (loading) return <Loader text="Building preview..." />;

    const sections = data?.sections || {};
    const newsletter = data?.newsletter || null;
    const orderedSections = SECTION_ORDER.filter((key) => sections[key]?.length);
    const monthNumber = parseInt(month, 10);
    const yearNumber = parseInt(year, 10);
    const totalItems = orderedSections.reduce((count, key) => count + sections[key].length, 0);
    const issueTitle = `${MONTH_NAMES[monthNumber]} ${yearNumber}`;

    return (
        <div className="newsletter-preview-page min-vh-100 py-4">
            <div className="container">
                <div className="newsletter-preview-toolbar">
                    <Link to="/archive" className="text-decoration-none small">Back to Archive</Link>
                    <div className="d-flex gap-2 flex-wrap">
                        {user?.role === 'admin' && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm"
                                    disabled={sharingAudience === 'students'}
                                    onClick={() => handleEmailShare('students')}
                                >
                                    {sharingAudience === 'students' ? 'Preparing...' : AUDIENCE_CONFIG.students.label}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm"
                                    disabled={sharingAudience === 'faculty'}
                                    onClick={() => handleEmailShare('faculty')}
                                >
                                    {sharingAudience === 'faculty' ? 'Preparing...' : AUDIENCE_CONFIG.faculty.label}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm"
                                    disabled={sharingAudience === 'everyone'}
                                    onClick={() => handleEmailShare('everyone')}
                                >
                                    {sharingAudience === 'everyone' ? 'Preparing...' : AUDIENCE_CONFIG.everyone.label}
                                </button>
                                <Link to="/admin" className="btn btn-primary btn-sm">Admin Panel</Link>
                            </>
                        )}
                        <button
                            onClick={downloadPDF}
                            disabled={downloading}
                            className="btn btn-warning btn-sm fw-semibold"
                        >
                            {downloading ? 'Preparing PDF...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                <div className="newsletter-preview-summary">
                    <div>
                        <div className="newsletter-preview-eyebrow">Issue Preview</div>
                        <h2 className="newsletter-preview-heading">{issueTitle}</h2>
                        <p className="newsletter-preview-copy mb-0">
                            Review the on-screen layout, jump between sections, and export the same issue as a PDF.
                            {newsletter?.issue ? ` ${newsletter.issue} is currently loaded for this month.` : ''}
                        </p>
                    </div>
                    <div className="newsletter-preview-stats">
                        <div className="newsletter-preview-stat">
                            <strong>{orderedSections.length}</strong>
                            <span>Sections</span>
                        </div>
                        <div className="newsletter-preview-stat">
                            <strong>{totalItems}</strong>
                            <span>Stories</span>
                        </div>
                    </div>
                </div>

                {orderedSections.length > 0 && (
                    <div className="newsletter-section-jumpbar">
                        {orderedSections.map((category) => (
                            <a key={category} href={`#section-${category}`} className="newsletter-section-chip">
                                {category.replace(/_/g, ' ')}
                            </a>
                        ))}
                    </div>
                )}

                <NewsletterCover month={monthNumber} year={yearNumber} newsletter={newsletter} />

                {orderedSections.length === 0 ? (
                    <div className="card p-4 text-center text-muted mx-auto mt-4" style={{ maxWidth: '860px' }}>
                        No approved content for this month yet.
                        {user?.role !== 'admin' && <span> Submit content or check back later.</span>}
                    </div>
                ) : (
                    orderedSections.map((category) => (
                        <SectionRenderer
                            key={category}
                            category={category}
                            items={sections[category]}
                            month={monthNumber}
                            year={yearNumber}
                            sectionId={`section-${category}`}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
