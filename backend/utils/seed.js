import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import supabase from '../supabase/client.js';

dotenv.config();

const USERS = [
    {
        name: 'Dr V Baby',
        email: 'admin@vnrvjiet.ac.in',
        password: 'Admin@1234',
        role: 'admin',
    },
    {
        name: 'Dr N Sandeep Chaitanya',
        email: 'sandeep@vnrvjiet.ac.in',
        password: 'Faculty@123',
        role: 'faculty',
    },
    {
        name: 'T Sridhar',
        email: 'sridhar@student.vnrvjiet.ac.in',
        password: 'Student@123',
        role: 'student',
        rollNumber: '22071A05K0',
    },
];

async function findAuthUserByEmail(email) {
    let page = 1;
    const perPage = 100;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        const match = data.users.find((user) => user.email === email);
        if (match) return match;
        if (data.users.length < perPage) return null;
        page += 1;
    }
}

async function upsertAuthUser(user) {
    const existing = await findAuthUserByEmail(user.email);

    if (existing) {
        const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
            password: user.password,
            email_confirm: true,
            user_metadata: {
                name: user.name,
                role: user.role,
                rollNumber: user.rollNumber,
            },
        });
        if (error) throw error;
        return data.user;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
            name: user.name,
            role: user.role,
            rollNumber: user.rollNumber,
        },
    });
    if (error) throw error;
    return data.user;
}

const seed = async () => {
    const authUsers = {};

    for (const user of USERS) {
        const authUser = await upsertAuthUser(user);
        authUsers[user.role] = authUser;

        const { error } = await supabase.from('profiles').upsert({
            id: authUser.id,
            name: user.name,
            email: user.email,
            role: user.role,
            roll_number: user.rollNumber || null,
        });
        if (error) throw error;
    }

    await supabase.from('submissions').delete().eq('year', 2026).eq('month', 2);
    await supabase.from('newsletters').delete().eq('year', 2026).eq('month', 2);

    const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletters')
        .insert({
            month: 2,
            year: 2026,
            title: 'February 2026',
            issue: 'Issue 1 Vol 2',
            editorial_board: [
                'Dr V Baby',
                'Dr S Nagini',
                'Dr N Sandeep Chaitanya',
                'Mr G Ram Reddy',
            ],
            banner_image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80',
            status: 'published',
            published_at: new Date().toISOString(),
        })
        .select('*')
        .single();

    if (newsletterError) throw newsletterError;

    const { error: submissionsError } = await supabase.from('submissions').insert([
        {
            title: 'CSE Department Overview',
            category: 'department_highlights',
            description: 'Key statistics and milestones of the CSE department.',
            highlights: [
                'Department was established in the year 1995',
                '2 UG programmes with an intake - CSE (240), CSBS (60)',
                'NBA Accreditation for UG-CSE (2008, 2013, 2016, 2019, 2022, 2025)',
                'Total number of faculty - 60',
                'No. of patents - 80 (7 Granted)',
                'No. of publications over last 5 years - 500',
                'Highest pay package - 92 Lakhs by Rubrik',
                'Placement Ratio in Premier IT Companies - 90%',
                'Recognized as Research Centre by JNTUH',
                'Hosted Smart India Hackathon 2025 Grand Finale Hardware Edition',
            ],
            submitted_by: authUsers.admin.id,
            status: 'approved',
            month: 2,
            year: 2026,
            order: 1,
            published_in: newsletter.id,
        },
        {
            title: 'Faculty Interaction with Dr. J. Chattopadhyay (DRDO)',
            category: 'department_activities',
            description: 'Faculty interaction session with Dr J. Chattopadhyay, Retired Director of Defence Research and Development Organisation (DRDO), on 26th February 2026 (Thursday) related to funding proposals.',
            images: [],
            submitted_by: authUsers.faculty.id,
            status: 'approved',
            month: 2,
            year: 2026,
            order: 1,
            published_in: newsletter.id,
        },
        {
            title: 'Guest Lecture Series on UI/UX Concepts',
            category: 'department_activities',
            description: 'Mr. Gnana Prakash, Mrs. Prasanna Pabba, and Mr. Akhil - in collaboration with Center for Presencing and Design Thinking (CPDT) organized a four-day series of guest lectures titled "Fundamental UI/UX Concepts" from 16th to 19th February 2026 at the CPDT Centre (E-507).',
            images: [],
            submitted_by: authUsers.faculty.id,
            status: 'approved',
            month: 2,
            year: 2026,
            order: 2,
            published_in: newsletter.id,
        },
        {
            title: 'Students Placed in F5 Networks',
            category: 'student_achievements',
            description: 'Bathula Sri Lasya (22071A05D8), Jakka Karthik (22071A05N0) and Kandula Sai Dhakshitha (22071A0582) placed in F5 Networks with a package of 21 LPA.',
            images: [],
            submitted_by: authUsers.student.id,
            status: 'approved',
            month: 2,
            year: 2026,
            order: 1,
            published_in: newsletter.id,
        },
        {
            title: 'LIVEWIRE CREW Won 1st Prize at PRAVEGA 2026',
            category: 'student_achievements',
            description: 'The LIVEWIRE CREW secured 1st position in the Lasya Dance Competition held at IISC Bangalore during PRAVEGA 2026. Team members: T. Sridhar (22071A05K0), V. Sai Bhargav (22071A05R5), Saad Uddin (25071A05R6), Isha (25071A3263), and Nikhil (25071A05D8), accompanied by Dr. M. Ravikanth, Sr. Assistant Professor.',
            images: [],
            submitted_by: authUsers.student.id,
            status: 'approved',
            month: 2,
            year: 2026,
            order: 2,
            published_in: newsletter.id,
        },
    ]);

    if (submissionsError) throw submissionsError;

    console.log('Seed complete');
    console.log('Admin: admin@vnrvjiet.ac.in / Admin@1234');
    console.log('Faculty: sandeep@vnrvjiet.ac.in / Faculty@123');
    console.log('Student: sridhar@student.vnrvjiet.ac.in / Student@123');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seed().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

export default seed;
