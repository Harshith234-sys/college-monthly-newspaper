import { supabase } from '../lib/supabase.js';
import { isCategoryAllowedForRole } from '../constants/newsletter.js';

// ── GET ─────────────────────────────────────────────────────────────────────

export async function getSubmissions({ status, month, year, userId } = {}) {
    let query = supabase
        .from('submissions')
        .select(`*, profile:profiles(name, role)`)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);
    if (userId) query = query.eq('submitted_by', userId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function getSubmissionById(id) {
    const { data, error } = await supabase
        .from('submissions')
        .select(`*, profile:profiles(name, role)`)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

// ── CREATE ───────────────────────────────────────────────────────────────────

export async function createSubmission({ title, category, description, images, highlights, month, year, userId, role }) {
    if (!userId) throw new Error('Please sign in again before submitting.');
    if (!isCategoryAllowedForRole(role, category)) {
        throw new Error(`The ${role || 'current'} role cannot submit to that category.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const { data, error } = await supabase
        .from('submissions')
        .insert({
            title, category, description,
            images: images || [],
            highlights: highlights || [],
            month: Number(month),
            year: Number(year),
            submitted_by: userId,
            status: 'pending',
        })
        .abortSignal(controller.signal)
        .select()
        .single();

    clearTimeout(timeout);

    if (error) {
        if (error.name === 'AbortError') {
            throw new Error('Submission timed out. Please check your connection and try again.');
        }
        throw error;
    }
    return data;
}

// ── UPDATE STATUS (admin) ────────────────────────────────────────────────────

export async function updateSubmissionStatus(id, status, adminComment = '') {
    const { data, error } = await supabase
        .from('submissions')
        .update({ status, admin_comment: adminComment })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSubmissionPdfSettings(id, pdfImageCount) {
    const { data, error } = await supabase
        .from('submissions')
        .update({ pdf_image_count: pdfImageCount })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSubmissionImages(id, images) {
    const { data, error } = await supabase
        .from('submissions')
        .update({ images })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSubmissionPdfSelection(id, selectedImages) {
    const { data, error } = await supabase
        .from('submissions')
        .update({
            pdf_selected_images: selectedImages,
            pdf_image_count: selectedImages.length,
        })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteSubmission(id) {
    const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
