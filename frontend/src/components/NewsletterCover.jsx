import { DEFAULT_EDITORIAL_BOARD, MONTH_NAMES } from '../constants/newsletter.js';

export default function NewsletterCover({ month, year, newsletter }) {
    const coverTitle = newsletter?.title || 'Monthly Newsletter';
    const issue = newsletter?.issue || '';
    const editorialBoard = newsletter?.editorialBoard?.length
        ? newsletter.editorialBoard
        : DEFAULT_EDITORIAL_BOARD;
    const bannerImageUrl = newsletter?.bannerImageUrl || '';

    return (
        <section className="newsletter-sheet newsletter-cover-sheet">
            <div className="newsletter-cover-top">
                <div className="newsletter-cover-brand">VNRVJIET</div>
                <p className="newsletter-cover-subtitle mb-0">
                    Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &amp; Technology
                    <br />
                    Department of Computer Science and Engineering
                </p>
            </div>

            <div className="newsletter-cover-center">
                {bannerImageUrl && (
                    <div className="newsletter-cover-banner">
                        <img
                            src={bannerImageUrl}
                            alt={`${MONTH_NAMES[month]} ${year} newsletter banner`}
                            className="newsletter-cover-banner-image"
                        />
                    </div>
                )}

                <div className="newsletter-cover-label">{coverTitle}</div>
                <h1 className="newsletter-cover-title">{MONTH_NAMES[month]} {year}</h1>
                <p className="newsletter-cover-period mb-0">
                    Academic updates, achievements, events, and highlights
                </p>
                {issue && <div className="newsletter-cover-issue">{issue}</div>}
            </div>

            <div className="newsletter-cover-footer">
                <div>
                    <strong>Editorial Board</strong>
                    {editorialBoard.map((member) => (
                        <p key={member} className="mb-0">{member}</p>
                    ))}
                </div>

                <div className="text-md-end">
                    <strong>Address</strong>
                    <p className="mb-0">Vignana Jyothi Nagar, Bachupally,</p>
                    <p className="mb-0">Hyderabad, Telangana 500090</p>
                    <p className="mb-0">Dept. of CSE, VNRVJIET</p>
                </div>
            </div>

            <footer className="newsletter-document-footer newsletter-cover-document-footer">
                <span>Dept. of CSE, VNRVJIET</span>
                <span>{MONTH_NAMES[month]} {year}</span>
            </footer>
        </section>
    );
}
