const LS_KEY = 'demo_submissions';

// ✅ initial fallback data (VERY IMPORTANT)
const demoSubmissions = [];

function initStore() {
    if (!localStorage.getItem(LS_KEY)) {
        localStorage.setItem(LS_KEY, JSON.stringify(demoSubmissions));
    }
}

export function getDemoSubmissions() {
    initStore();
    try {
        return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch (e) {
        console.error("Error reading localStorage:", e);
        return [...demoSubmissions];
    }
}

export function addDemoSubmission(submission) {
    const all = getDemoSubmissions();

    const newSub = {
        ...submission,
        _id: 's' + Date.now(),
        status: 'pending',
        images: submission.images || [],
    };

    all.unshift(newSub);
    localStorage.setItem(LS_KEY, JSON.stringify(all));

    return newSub;
}

export function updateDemoSubmissionStatus(id, status) {
    const all = getDemoSubmissions();

    const updated = all.map((s) =>
        s._id === id ? { ...s, status } : s
    );

    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    return updated;
}