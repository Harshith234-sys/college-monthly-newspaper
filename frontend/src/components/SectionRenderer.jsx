const CATEGORY_LABELS = {
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

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function getSingleImageLayout({ index, introLength, image }) {
    const aspectRatio = image?.width && image?.height ? image.width / image.height : 1.2;

    if (aspectRatio > 1.75 || introLength < 140) return 'figure-full';
    if (aspectRatio < 0.9) return index % 3 === 0 ? 'figure-left figure-compact' : 'figure-right figure-compact';
    if (index % 4 === 2) return 'figure-bottom';
    return index % 2 === 0 ? 'figure-right' : 'figure-left';
}

function getGalleryLayoutClass(selectedImages, index) {
    if (selectedImages.length <= 1) return '';
    if (index % 4 === 1) return 'gallery-bottom';
    if (selectedImages.length === 3) return 'gallery-three';
    if (selectedImages.length >= 4) return 'gallery-four-plus';
    return '';
}

function SubmissionItem({ item, index }) {
    const allImages = item.images || [];
    const selectedKeys = item.pdfSelectedImages ?? item.pdf_selected_images ?? [];
    const selectedImages = selectedKeys.length
        ? allImages.filter((img) => selectedKeys.includes(img.publicId || img.url))
        : allImages.slice(0, Math.max(0, Math.min(
            item.pdfImageCount ?? item.pdf_image_count ?? allImages.length,
            allImages.length
        )));
    const hasSingleImage = selectedImages.length === 1;
    const hasGallery = selectedImages.length > 1;
    const singleImage = selectedImages[0];
    const description = item.description || '';
    const sentences = description.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [description];
    const introText = sentences.slice(0, 1).join(' ').trim();
    const remainingText = sentences.slice(1).join(' ').trim();
    const singleImageLayout = hasSingleImage
        ? getSingleImageLayout({ index, introLength: introText.length, image: singleImage })
        : '';
    const singleImageClassName = [
        'newsletter-item-figure',
        'newsletter-item-figure-single',
        hasSingleImage && singleImageLayout,
        hasSingleImage && singleImage?.url && !singleImage?.caption ? 'figure-clean' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const galleryClassName = [
        'newsletter-item-gallery',
        getGalleryLayoutClass(selectedImages, index),
    ]
        .filter(Boolean)
        .join(' ');
    const renderSingleImage = hasSingleImage && singleImageLayout !== 'figure-bottom';
    const renderSingleImageBottom = hasSingleImage && singleImageLayout === 'figure-bottom';
    const renderGalleryEarly = hasGallery && !galleryClassName.includes('gallery-bottom');
    const renderGalleryBottom = hasGallery && galleryClassName.includes('gallery-bottom');

    return (
        <article className="newsletter-item">
            <h3 className="newsletter-item-title">{item.title}</h3>

            <div className="newsletter-item-content">
                {introText && (
                    <p className="newsletter-item-description newsletter-item-intro">{introText}</p>
                )}

                {renderSingleImage && (
                    <figure className={singleImageClassName}>
                        <img
                            src={singleImage.url}
                            alt={singleImage.caption || item.title}
                            className="newsletter-item-image"
                        />
                        {singleImage.caption && (
                            <figcaption>{singleImage.caption}</figcaption>
                        )}
                    </figure>
                )}

                {renderGalleryEarly && (
                    <div className={galleryClassName}>
                        {selectedImages.map((img, imageIndex) => (
                            <figure
                                key={imageIndex}
                                className={`newsletter-item-gallery-figure ${selectedImages.length !== 2 && ((img.width && img.height && img.width / img.height > 1.7) || (!img.width && !img.height && imageIndex === 0 && selectedImages.length >= 3)) ? 'wide' : ''}`}
                            >
                                <img
                                    src={img.url}
                                    alt={img.caption || item.title}
                                    className="newsletter-item-image"
                                />
                                {img.caption && <figcaption>{img.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                )}

                {remainingText && (
                    <p className="newsletter-item-description">{remainingText}</p>
                )}
                {!introText && !remainingText && (
                    <p className="newsletter-item-description">{description}</p>
                )}

                {renderSingleImageBottom && (
                    <figure className={singleImageClassName}>
                        <img
                            src={singleImage.url}
                            alt={singleImage.caption || item.title}
                            className="newsletter-item-image"
                        />
                        {singleImage.caption && (
                            <figcaption>{singleImage.caption}</figcaption>
                        )}
                    </figure>
                )}

                {renderGalleryBottom && (
                    <div className={galleryClassName}>
                        {selectedImages.map((img, imageIndex) => (
                            <figure
                                key={imageIndex}
                                className={`newsletter-item-gallery-figure ${selectedImages.length !== 2 && ((img.width && img.height && img.width / img.height > 1.7) || (!img.width && !img.height && imageIndex === 0 && selectedImages.length >= 3)) ? 'wide' : ''}`}
                            >
                                <img
                                    src={img.url}
                                    alt={img.caption || item.title}
                                    className="newsletter-item-image"
                                />
                                {img.caption && <figcaption>{img.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                )}

                {item.highlights?.length > 0 && (
                    <ul className="newsletter-item-highlights">
                        {item.highlights.map((highlight, highlightIndex) => (
                            <li key={highlightIndex}>{highlight}</li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    );
}

export default function SectionRenderer({ category, items, month, year }) {
    return (
        <section className="newsletter-sheet newsletter-section-sheet">
            <header className="newsletter-section-header">
                <div>
                    <div className="newsletter-section-kicker">Monthly Review</div>
                    <h2 className="newsletter-section-title">
                        {CATEGORY_LABELS[category] || category}
                    </h2>
                </div>
                <div className="newsletter-section-period">
                    {MONTH_NAMES[month]} {year}
                </div>
            </header>

            <div className="newsletter-section-body">
                {items.map((item, index) => (
                    <SubmissionItem key={item.id || item._id} item={item} index={index} />
                ))}
            </div>

            <footer className="newsletter-document-footer">
                <span>Dept. of CSE, VNRVJIET</span>
                <span>{MONTH_NAMES[month]} {year}</span>
            </footer>
        </section>
    );
}
