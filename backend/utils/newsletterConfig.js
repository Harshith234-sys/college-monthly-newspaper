export const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const SECTION_LABELS = {
    department_highlights: 'CSE Department Highlights',
    department_activities: 'Department Activities',
    student_achievements: 'Student Achievements',
    student_activities: 'Student Activities',
    faculty_achievements: 'Faculty Achievements',
    faculty_participation: 'Faculty Participation',
    research_activities: 'Research Activities',
    industrial_visits: 'Industrial Visits',
    patent_publications: 'Patent Publications',
};

export const CATEGORY_ACCESS = {
    student: ['student_achievements', 'student_activities'],
    club_rep: ['student_achievements', 'student_activities'],
    faculty: [
        'department_highlights',
        'department_activities',
        'faculty_achievements',
        'faculty_participation',
        'research_activities',
        'industrial_visits',
        'patent_publications',
    ],
};

export const DEFAULT_EDITORIAL_BOARD = [
    'Dr V Baby',
    'Dr S Nagini',
    'Dr N Sandeep Chaitanya',
    'Mr G Ram Reddy',
];

export const DEFAULT_COVER = {
    title: 'Monthly Newsletter',
    issue: '',
    bannerImageUrl: '',
    editorialBoard: DEFAULT_EDITORIAL_BOARD,
};

export function getAllowedCategoriesForRole(role) {
    if (role === 'admin') {
        return Object.keys(SECTION_LABELS);
    }

    return CATEGORY_ACCESS[role] || [];
}

export function isCategoryAllowedForRole(role, category) {
    return getAllowedCategoriesForRole(role).includes(category);
}
