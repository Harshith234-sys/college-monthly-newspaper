import { supabase } from '../lib/supabase.js';
import { normalizeNewsletter } from '../constants/newsletter.js';

export async function getNewsletters() {
    const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeNewsletter);
}

export async function getNewsletterByPeriod(year, month) {
    const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('year', Number(year))
        .eq('month', Number(month))
        .maybeSingle();

    if (error) throw error;
    return normalizeNewsletter(data);
}

export async function getNewsletterWithSections(year, month) {
    const nl = await getNewsletterByPeriod(year, month);

    const { data: subs, error } = await supabase
        .from('submissions')
        .select('*, profile:profiles(name, role)')
        .eq('year', Number(year))
        .eq('month', Number(month))
        .eq('status', 'approved')
        .order('order')
        .order('created_at');

    if (error) throw error;

    const sections = {};
    (subs || []).forEach((submission) => {
        if (!sections[submission.category]) sections[submission.category] = [];
        sections[submission.category].push(submission);
    });

    return { newsletter: nl, sections };
}

export async function publishNewsletter(id) {
    const { data, error } = await supabase
        .from('newsletters')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveNewsletterIssueDetails({
    month,
    year,
    title,
    issue,
    editorialBoard,
    bannerImageUrl,
}) {
    const { data, error } = await supabase
        .from('newsletters')
        .upsert({
            month: Number(month),
            year: Number(year),
            title: title?.trim() || 'Monthly Newsletter',
            issue: issue?.trim() || null,
            editorial_board: (editorialBoard || []).map((member) => member.trim()).filter(Boolean),
            banner_image_url: bannerImageUrl?.trim() || null,
        }, { onConflict: 'month,year' })
        .select('*')
        .single();

    if (error) throw error;
    return normalizeNewsletter(data);
}

export async function getRecipientEmailsByRoles(roles) {
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .in('role', roles)
        .eq('is_approved', true);

    if (error) throw error;
    return [...new Set((data || []).map((profile) => profile.email).filter(Boolean))];
}

export async function downloadNewsletterPdf(year, month) {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
        throw new Error('Please sign in again before downloading the PDF.');
    }

    const response = await fetch(`/api/pdf/${year}/${month}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        let message = 'Failed to generate PDF';
        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch {
            // Keep the fallback message when the response is not JSON.
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-${year}-${month}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
