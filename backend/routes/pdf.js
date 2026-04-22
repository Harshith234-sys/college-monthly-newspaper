import express from 'express';
import puppeteer from 'puppeteer';
import supabase from '../supabase/client.js';
import { mapSubmission } from '../supabase/mappers.js';
import { buildNewsletterHTML } from '../utils/htmlTemplate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const submissionSelect = '*, profile:profiles(id,name,email,role,department,roll_number,is_approved,created_at,updated_at)';

// GET /api/pdf/:year/:month
router.get('/:year/:month', protect, async (req, res) => {
    const { year, month } = req.params;
    try {
        const { data: newsletter, error: newsletterError } = await supabase
            .from('newsletters')
            .select('*')
            .eq('year', Number(year))
            .eq('month', Number(month))
            .maybeSingle();

        if (newsletterError) return res.status(500).json({ message: newsletterError.message });

        const { data, error } = await supabase
            .from('submissions')
            .select(submissionSelect)
            .eq('year', Number(year))
            .eq('month', Number(month))
            .eq('status', 'approved')
            .order('category', { ascending: true })
            .order('order', { ascending: true });

        if (error) return res.status(500).json({ message: error.message });

        const grouped = {};
        (data || []).map(mapSubmission).forEach((submission) => {
            if (!grouped[submission.category]) grouped[submission.category] = [];
            grouped[submission.category].push(submission);
        });

        const html = buildNewsletterHTML({ year, month, sections: grouped, newsletter });

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.evaluate(async () => {
            if (document.fonts?.ready) await document.fonts.ready;
        });
        await page.waitForFunction(() => window.__layoutReady === true, { timeout: 15000 });
        await page.emulateMediaType('print');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
        });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="newsletter-${year}-${month}.pdf"`,
        });
        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'PDF generation failed', error: err.message });
    }
});

export default router;
