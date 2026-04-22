export function mapProfile(profile) {
    if (!profile) return null;
    return {
        id: profile.id,
        _id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        rollNumber: profile.roll_number,
        isApproved: profile.is_approved,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
    };
}

export function mapSubmission(submission) {
    if (!submission) return null;
    const submittedBy = submission.profile || submission.submitted_by_profile;
    return {
        id: submission.id,
        _id: submission.id,
        title: submission.title,
        category: submission.category,
        description: submission.description,
        images: submission.images || [],
        highlights: submission.highlights || [],
        submittedBy: mapProfile(submittedBy) || submission.submitted_by,
        status: submission.status,
        adminComment: submission.admin_comment,
        pdfImageCount: submission.pdf_image_count,
        pdfSelectedImages: submission.pdf_selected_images || [],
        month: submission.month,
        year: submission.year,
        publishedIn: submission.published_in,
        order: submission.order,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
    };
}

export function mapNewsletter(newsletter) {
    if (!newsletter) return null;
    return {
        id: newsletter.id,
        _id: newsletter.id,
        month: newsletter.month,
        year: newsletter.year,
        title: newsletter.title,
        issue: newsletter.issue,
        editorialBoard: newsletter.editorial_board || [],
        bannerImageUrl: newsletter.banner_image_url,
        status: newsletter.status,
        submissions: newsletter.submissions || [],
        publishedAt: newsletter.published_at,
        pdfUrl: newsletter.pdf_url,
        createdAt: newsletter.created_at,
        updatedAt: newsletter.updated_at,
    };
}
