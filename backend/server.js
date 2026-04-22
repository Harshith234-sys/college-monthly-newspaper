import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './supabase/client.js';

import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import newsletterRoutes from './routes/newsletters.js';
import pdfRoutes from './routes/pdf.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

(async () => {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) console.error('Supabase connection error:', error.message);
    else console.log('Supabase connected');
})();

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/newsletters', newsletterRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
