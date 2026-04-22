export const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const SECTION_ORDER = [
    'department_highlights',
    'department_activities',
    'student_achievements',
    'student_activities',
    'faculty_achievements',
    'faculty_participation',
    'research_activities',
    'industrial_visits',
    'patent_publications',
];

export const CATEGORY_OPTIONS = [
    { value: 'department_highlights', label: 'CSE Department Highlights', roles: ['faculty', 'admin'] },
    { value: 'department_activities', label: 'Department Activities', roles: ['faculty', 'admin'] },
    { value: 'student_achievements', label: 'Student Achievements', roles: ['student', 'club_rep', 'admin'] },
    { value: 'student_activities', label: 'Student Activities', roles: ['student', 'club_rep', 'admin'] },
    { value: 'faculty_achievements', label: 'Faculty Achievements', roles: ['faculty', 'admin'] },
    { value: 'faculty_participation', label: 'Faculty Participation', roles: ['faculty', 'admin'] },
    { value: 'research_activities', label: 'Research Activities', roles: ['faculty', 'admin'] },
    { value: 'industrial_visits', label: 'Industrial Visits', roles: ['faculty', 'admin'] },
    { value: 'patent_publications', label: 'Patent Publications', roles: ['faculty', 'admin'] },
];

export const DEFAULT_EDITORIAL_BOARD = [
    'Dr V Baby',
    'Dr S Nagini',
    'Dr N Sandeep Chaitanya',
    'Mr G Ram Reddy',
];

export function getAllowedCategoriesForRole(role) {
    return CATEGORY_OPTIONS.filter((option) => option.roles.includes(role || 'student'));
}

export function isCategoryAllowedForRole(role, category) {
    return CATEGORY_OPTIONS.some(
        (option) => option.value === category && option.roles.includes(role || 'student')
    );
}

export function normalizeNewsletter(newsletter) {
    if (!newsletter) return null;

    return {
        ...newsletter,
        editorialBoard: newsletter.editorialBoard
            || newsletter.editorial_board
            || DEFAULT_EDITORIAL_BOARD,
        bannerImageUrl: newsletter.bannerImageUrl
            || newsletter.banner_image_url
            || '',
    };
}
