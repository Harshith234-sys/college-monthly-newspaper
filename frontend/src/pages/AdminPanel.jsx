import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteSubmission,
    getSubmissions,
    updateSubmissionImages,
    updateSubmissionPdfSelection,
    updateSubmissionStatus,
} from '../api/submissions.js';
import {
    getNewsletterByPeriod,
    saveNewsletterIssueDetails,
} from '../api/newsletters.js';
import Loader from '../components/Loader.jsx';
import { DEFAULT_EDITORIAL_BOARD } from '../constants/newsletter.js';
import toast from 'react-hot-toast';

function getImageKey(image) {
    return image.publicId || image.url;
}

function getSelectedImageKeys(submission) {
    const selected = submission.pdf_selected_images ?? submission.pdfSelectedImages;
    if (selected?.length) return selected;
    return (submission.images || []).map(getImageKey);
}

function createIssueForm(month, year, newsletter) {
    return {
        month,
        year,
        title: newsletter?.title || 'Monthly Newsletter',
        issue: newsletter?.issue || '',
        bannerImageUrl: newsletter?.bannerImageUrl || '',
        editorialBoardText: (newsletter?.editorialBoard?.length
            ? newsletter.editorialBoard
            : DEFAULT_EDITORIAL_BOARD).join('\n'),
    };
}

export default function AdminPanel() {
    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingIssue, setSavingIssue] = useState(false);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [search, setSearch] = useState('');
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [issueForm, setIssueForm] = useState(createIssueForm(now.getMonth() + 1, now.getFullYear(), null));

    const syncSubmission = (id, updater) => {
        setSubmissions((current) =>
            current.map((submission) =>
                submission.id === id ? updater(submission) : submission
            )
        );
        setSelected((current) => (
            current?.id === id ? updater(current) : current
        ));
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const period = { month, year };
            const [all, filtered, newsletter] = await Promise.all([
                getSubmissions(period),
                getSubmissions({ ...period, status: filter }),
                getNewsletterByPeriod(year, month),
            ]);

            setSubmissions(filtered);
            setCounts({
                pending: all.filter((submission) => submission.status === 'pending').length,
                approved: all.filter((submission) => submission.status === 'approved').length,
                rejected: all.filter((submission) => submission.status === 'rejected').length,
            });
            setIssueForm(createIssueForm(month, year, newsletter));
        } catch {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [filter, month, year]);

    const handleStatus = async (id, status) => {
        try {
            await updateSubmissionStatus(id, status);
            toast.success(`Submission ${status}`);
            setSelected(null);
            fetchAll();
        } catch {
            toast.error('Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this submission permanently?')) return;
        try {
            await deleteSubmission(id);
            toast.success('Submission deleted');
            setSelected(null);
            fetchAll();
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleTogglePdfImage = async (submission, image) => {
        const imageKey = getImageKey(image);
        const currentKeys = getSelectedImageKeys(submission);
        const nextKeys = currentKeys.includes(imageKey)
            ? currentKeys.filter((key) => key !== imageKey)
            : [...currentKeys, imageKey];

        try {
            await updateSubmissionPdfSelection(submission.id, nextKeys);
            syncSubmission(submission.id, (current) => ({
                ...current,
                pdf_selected_images: nextKeys,
                pdf_image_count: nextKeys.length,
            }));
            toast.success('PDF image selection updated');
        } catch (error) {
            toast.error(error.message || 'Could not update PDF image selection');
        }
    };

    const handleRemoveImage = async (submission, image) => {
        if (!window.confirm('Remove this image from the submission?')) return;

        const imageKey = getImageKey(image);
        const nextImages = (submission.images || []).filter((current) => getImageKey(current) !== imageKey);
        const nextSelectedKeys = getSelectedImageKeys(submission).filter((key) => key !== imageKey);

        try {
            await updateSubmissionImages(submission.id, nextImages);
            await updateSubmissionPdfSelection(submission.id, nextSelectedKeys);

            syncSubmission(submission.id, (current) => ({
                ...current,
                images: nextImages,
                pdf_selected_images: nextSelectedKeys,
                pdf_image_count: nextSelectedKeys.length,
            }));
            toast.success('Image removed');
        } catch (error) {
            toast.error(error.message || 'Could not remove image');
        }
    };

    const handleSaveIssue = async (event) => {
        event.preventDefault();
        setSavingIssue(true);
        try {
            const savedNewsletter = await saveNewsletterIssueDetails({
                month,
                year,
                title: issueForm.title,
                issue: issueForm.issue,
                bannerImageUrl: issueForm.bannerImageUrl,
                editorialBoard: issueForm.editorialBoardText.split('\n'),
            });

            setIssueForm(createIssueForm(month, year, savedNewsletter));
            toast.success('Issue cover details saved');
        } catch (error) {
            toast.error(error.message || 'Could not save issue details');
        } finally {
            setSavingIssue(false);
        }
    };

    const STATUS_BADGE = {
        pending: 'badge-pending',
        approved: 'badge-approved',
        rejected: 'badge-rejected',
    };

    const visibleSubmissions = submissions.filter((submission) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [
            submission.title,
            submission.description,
            submission.category,
            submission.profile?.name,
        ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
    });

    return (
        <div className="container mt-4 mb-5">
            <div className="admin-toolbar shadow-sm mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Admin Panel</h4>
                    <p className="text-muted small mb-0">
                        Review submissions and customize the issue cover for the selected month.
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <Link to={`/preview/${year}/${month}`} className="btn btn-outline-primary btn-sm">
                        Open Preview
                    </Link>

                    <input
                        type="search"
                        className="form-control form-control-sm admin-search"
                        placeholder="Search title, category, contributor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="form-select form-select-sm admin-period-select"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, index) => (
                            <option key={index + 1} value={index + 1}>
                                {new Date(0, index).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        className="form-control form-control-sm admin-year-input"
                        value={year}
                        min="2020"
                        max="2030"
                        onChange={(e) => setYear(Number(e.target.value))}
                    />
                </div>
            </div>

            <form className="card p-4 shadow-sm mb-4" onSubmit={handleSaveIssue}>
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">Issue Cover Settings</h5>
                        <p className="text-muted small mb-0">
                            Update the newsletter label, issue number, banner image, and editorial board for this issue.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-dark btn-sm" disabled={savingIssue}>
                        {savingIssue ? 'Saving...' : 'Save Cover Details'}
                    </button>
                </div>

                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Cover Label</label>
                        <input
                            type="text"
                            className="form-control"
                            value={issueForm.title}
                            onChange={(e) => setIssueForm((current) => ({ ...current, title: e.target.value }))}
                            placeholder="Monthly Newsletter"
                        />
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Issue Number</label>
                        <input
                            type="text"
                            className="form-control"
                            value={issueForm.issue}
                            onChange={(e) => setIssueForm((current) => ({ ...current, issue: e.target.value }))}
                            placeholder="Issue 2 Vol 1"
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-semibold">Banner Image URL</label>
                        <input
                            type="url"
                            className="form-control"
                            value={issueForm.bannerImageUrl}
                            onChange={(e) => setIssueForm((current) => ({ ...current, bannerImageUrl: e.target.value }))}
                            placeholder="https://..."
                        />
                        <div className="form-text">This image appears on the preview cover and in the generated PDF.</div>
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-semibold">Editorial Board</label>
                        <textarea
                            rows={5}
                            className="form-control"
                            value={issueForm.editorialBoardText}
                            onChange={(e) => setIssueForm((current) => ({ ...current, editorialBoardText: e.target.value }))}
                            placeholder={'One member per line'}
                        />
                    </div>
                </div>
            </form>

            <div className="row g-3 mb-4">
                {[
                    { label: 'Pending', value: counts.pending, tone: 'warning' },
                    { label: 'Approved', value: counts.approved, tone: 'success' },
                    { label: 'Rejected', value: counts.rejected, tone: 'danger' },
                ].map((item) => (
                    <div className="col-12 col-md-4" key={item.label}>
                        <div className={`admin-stat admin-stat-${item.tone}`}>
                            <div className="small text-uppercase text-muted mb-1">{item.label}</div>
                            <div className="fs-4 fw-bold">{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="d-flex gap-2 mb-4 flex-wrap">
                {['pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`btn btn-sm text-capitalize ${filter === status ? 'btn-dark' : 'btn-outline-secondary'}`}
                    >
                        {status}
                        <span className={`badge ms-1 ${filter === status ? 'bg-light text-dark' : 'bg-secondary'}`}>
                            {counts[status]}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <Loader text="Loading submissions..." />
            ) : (
                <>
                    {visibleSubmissions.length === 0 && (
                        <div className="card p-4 text-center text-muted">
                            No {filter} submissions match this view.
                        </div>
                    )}

                    {visibleSubmissions.map((submission) => {
                        const selectedKeys = getSelectedImageKeys(submission);

                        return (
                            <div
                                key={submission.id}
                                className="card p-3 shadow-sm mb-3 admin-submission-card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelected(selected?.id === submission.id ? null : submission)}
                            >
                                <div className="d-flex justify-content-between align-items-start gap-3">
                                    <div>
                                        <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                                            <p className="fw-bold mb-0">{submission.title}</p>
                                            <span className="badge text-bg-light text-capitalize">
                                                {submission.category.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <small className="text-muted">
                                            {submission.profile?.name || 'Contributor'} | {submission.month}/{submission.year}
                                        </small>
                                    </div>

                                    <span className={STATUS_BADGE[submission.status]}>{submission.status}</span>
                                </div>

                                {selected?.id === submission.id && (
                                    <div className="mt-3 pt-3 border-top">
                                        <p className="small text-dark mb-3">{submission.description}</p>

                                        {submission.images?.length > 0 && (
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                                    <label className="form-label small fw-semibold mb-0">
                                                        PDF image selection
                                                    </label>
                                                    <small className="text-muted">
                                                        {selectedKeys.length} of {submission.images.length} selected
                                                    </small>
                                                </div>

                                                <div className="admin-image-grid">
                                                    {submission.images.map((img, index) => {
                                                        const imageKey = getImageKey(img);
                                                        const isSelected = selectedKeys.includes(imageKey);

                                                        return (
                                                            <div
                                                                key={imageKey || index}
                                                                className={`admin-image-card ${isSelected ? 'is-selected' : ''}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <img
                                                                    src={img.url}
                                                                    alt={img.caption || `Submission image ${index + 1}`}
                                                                    className="admin-image-preview"
                                                                />
                                                                <div className="admin-image-actions">
                                                                    <button
                                                                        type="button"
                                                                        className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-secondary'}`}
                                                                        onClick={() => handleTogglePdfImage(submission, img)}
                                                                    >
                                                                        {isSelected ? 'Selected for PDF' : 'Add to PDF'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleRemoveImage(submission, img)}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="d-flex gap-2 flex-wrap">
                                            {submission.status !== 'approved' && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatus(submission.id, 'approved');
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                            )}

                                            {submission.status !== 'rejected' && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatus(submission.id, 'rejected');
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            )}

                                            <button
                                                className="btn btn-dark btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(submission.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
