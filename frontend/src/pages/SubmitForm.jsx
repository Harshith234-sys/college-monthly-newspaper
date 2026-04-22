import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createSubmission } from '../api/submissions.js';
import { uploadMultiple } from '../api/cloudinary.js';
import toast from 'react-hot-toast';
import { getAllowedCategoriesForRole } from '../constants/newsletter.js';

export default function SubmitForm() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const now = new Date();

    const [form, setForm] = useState({
        title: '', category: '', description: '',
        month: now.getMonth() + 1, year: now.getFullYear(),
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const allowedCategories = getAllowedCategoriesForRole(user?.role);

    const handleImageUpload = async (files) => {
        const fileArr = Array.from(files);
        if (!fileArr.length) return;
        setUploading(true);

        const localPreviews = fileArr.map((f) => URL.createObjectURL(f));
        setPreviews((prev) => [...prev, ...localPreviews]);

        try {
            const uploaded = await uploadMultiple(fileArr);
            setImages((prev) => [...prev, ...uploaded]);
            toast.success(`${uploaded.length} image(s) uploaded ☁️`);
        } catch {
            const localImgs = localPreviews.map((url) => ({ url, publicId: null }));
            setImages((prev) => [...prev, ...localImgs]);
            toast('Using local preview — Cloudinary unavailable', { icon: '⚠️' });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx) => {
        setPreviews((p) => p.filter((_, i) => i !== idx));
        setImages((p) => p.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category) return toast.error('Please select a category');
        if (!allowedCategories.some((category) => category.value === form.category)) {
            return toast.error('Your role cannot submit to that category.');
        }
        setSubmitting(true);
        try {
            await createSubmission({ ...form, images, userId: user.id, role: user.role });
            toast.success('Submission sent for review!');
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mt-4" style={{ maxWidth: '680px' }}>
            <h4 className="fw-bold mb-1">New Submission</h4>
            <p className="text-muted small mb-4">
                Your submission will be reviewed by the admin before publishing. Categories are filtered for your
                role: <strong className="text-capitalize">{user?.role || 'student'}</strong>.
            </p>

            <div className="card p-4 shadow-sm">
                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label className="form-label fw-medium">Category *</label>
                        <select required className="form-select" value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            <option value="">Select a category...</option>
                            {allowedCategories.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-medium">Title *</label>
                        <input required type="text" className="form-control"
                            placeholder="e.g. Guest Lecture on Cloud Computing"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-medium">Description *</label>
                        <textarea required rows={5} className="form-control"
                            placeholder="Describe the event, achievement, or activity..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="form-label fw-medium">Month</label>
                            <select className="form-select" value={form.month}
                                onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="form-label fw-medium">Year</label>
                            <input type="number" className="form-control"
                                value={form.year} min="2020" max="2030"
                                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-medium">Images (optional)</label>
                        <div className="border rounded p-3 text-center"
                            style={{ borderStyle: 'dashed', borderColor: '#dee2e6' }}>
                            <input type="file" accept="image/*" multiple
                                className="d-none" id="img-input"
                                onChange={(e) => handleImageUpload(e.target.files)} />
                            <label htmlFor="img-input" className="text-primary small" style={{ cursor: 'pointer' }}>
                                {uploading
                                    ? <span><span className="spinner-border spinner-border-sm me-1" />Uploading...</span>
                                    : 'Click to attach images'}
                            </label>
                        </div>

                        {previews.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {previews.map((src, i) => (
                                    <div key={i} className="position-relative">
                                        <img src={src} alt="" className="rounded border"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                        <button type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                                            style={{ width: '18px', height: '18px', fontSize: '10px', lineHeight: 1 }}
                                            onClick={() => removeImage(i)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={submitting || uploading} className="btn btn-primary w-100">
                        {submitting
                            ? <span><span className="spinner-border spinner-border-sm me-2" />Submitting...</span>
                            : 'Submit for Review'}
                    </button>
                </form>
            </div>
        </div>
    );
}
