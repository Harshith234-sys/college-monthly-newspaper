import { DEFAULT_COVER, MONTH_NAMES, SECTION_LABELS } from './newsletterConfig.js';

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderHighlights(item) {
    if (!item.highlights?.length) return '';

    return `
      <ul class="item-highlights">
        ${item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}
      </ul>
    `;
}

function getSelectedImages(item) {
    const allImages = item.images || [];
    const selectedKeys = item.pdfSelectedImages ?? item.pdf_selected_images ?? [];
    const preferredCount = item.pdfImageCount ?? item.pdf_image_count;

    if (selectedKeys.length) {
        return allImages.filter((image) => selectedKeys.includes(image.publicId || image.url));
    }

    if (preferredCount == null) return allImages;
    return allImages.slice(0, Math.max(0, Math.min(preferredCount, allImages.length)));
}

function splitDescription(description = '') {
    const sentences = description.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [description];
    return {
        intro: sentences.slice(0, 1).join(' ').trim(),
        remainder: sentences.slice(1).join(' ').trim(),
    };
}

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

function renderImages(item, index) {
    const selectedImages = getSelectedImages(item);
    if (!selectedImages.length) return '';

    if (selectedImages.length === 1) {
        const image = selectedImages[0];
        const layoutClass = getSingleImageLayout({
            index,
            introLength: splitDescription(item.description).intro.length,
            image,
        });
        return `
          <figure class="item-figure item-figure-single ${layoutClass}" data-layout-seed="${index % 2}">
            <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.caption || item.title)}" />
            ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
          </figure>
        `;
    }

    const galleryLayoutClass = getGalleryLayoutClass(selectedImages, index);
    return `
      <div class="item-gallery ${galleryLayoutClass}" data-count="${item.images.length}">
        ${selectedImages
            .map((image) => `
              <figure class="item-figure-grid">
                <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.caption || item.title)}" />
                ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
              </figure>
            `)
            .join('')}
      </div>
    `;
}

function renderItem(item, index) {
    const description = splitDescription(item.description);
    const selectedImages = getSelectedImages(item);
    const singleLayout = selectedImages.length === 1
        ? getSingleImageLayout({ index, introLength: description.intro.length, image: selectedImages[0] })
        : '';
    const galleryLayout = selectedImages.length > 1 ? getGalleryLayoutClass(selectedImages, index) : '';
    const renderImagesEarly = !singleLayout.includes('figure-bottom') && !galleryLayout.includes('gallery-bottom');
    const renderImagesBottom = singleLayout.includes('figure-bottom') || galleryLayout.includes('gallery-bottom');

    return `
      <article class="item">
        <h3 class="item-title">${escapeHtml(item.title)}</h3>
        <div class="item-content">
          ${description.intro ? `<p class="item-description item-description-intro">${escapeHtml(description.intro)}</p>` : ''}
          ${renderImagesEarly ? renderImages(item, index) : ''}
          ${description.remainder ? `<p class="item-description">${escapeHtml(description.remainder)}</p>` : ''}
          ${!description.intro && !description.remainder ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
          ${renderImagesBottom ? renderImages(item, index) : ''}
          ${renderHighlights(item)}
        </div>
      </article>
    `;
}

export function buildNewsletterHTML({ year, month, sections, newsletter }) {
    const monthName = MONTH_NAMES[parseInt(month, 10)] || '';
    const cover = {
        ...DEFAULT_COVER,
        title: newsletter?.title || DEFAULT_COVER.title,
        issue: newsletter?.issue || DEFAULT_COVER.issue,
        editorialBoard: newsletter?.editorial_board || DEFAULT_COVER.editorialBoard,
        bannerImageUrl: newsletter?.banner_image_url || DEFAULT_COVER.bannerImageUrl,
    };

    const sectionsHTML = Object.entries(sections)
        .map(
            ([category, items]) => `
              <section class="section">
                <header class="section-header">
                  <div>
                    <div class="section-kicker">Monthly Review</div>
                    <h2>${escapeHtml(SECTION_LABELS[category] || category)}</h2>
                  </div>
                  <div class="section-period">${escapeHtml(monthName)} ${escapeHtml(year)}</div>
                </header>

                <div class="section-body">
                  ${items.map(renderItem).join('')}
                </div>
              </section>
            `
        )
        .join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(monthName)} ${escapeHtml(year)} Newsletter</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 16mm;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    color: #1f2937;
    font-family: "Segoe UI", Arial, sans-serif;
    background: #ffffff;
  }

  body {
    font-size: 12.5px;
    line-height: 1.6;
  }

  .cover {
    min-height: calc(297mm - 30mm);
    padding: 14mm 12mm 10mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 2px solid #c9a84c;
    background: linear-gradient(180deg, #fffaf0 0%, #ffffff 100%);
    page-break-after: always;
    break-after: page;
  }

  .cover-top {
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 10mm;
  }

  .cover-brand {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #0f4c81;
    margin-bottom: 6px;
  }

  .cover-subtitle {
    max-width: 120mm;
    font-size: 13px;
    line-height: 1.7;
    color: #374151;
  }

  .cover-center {
    padding: 16mm 0 10mm;
  }

  .cover-banner {
    width: 100%;
    margin: 0 0 14mm;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #d7dce2;
    background: #f3f4f6;
  }

  .cover-banner img {
    display: block;
    width: 100%;
    max-height: 78mm;
    object-fit: cover;
  }

  .cover-label {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #8b6b1f;
    margin-bottom: 10px;
  }

  .cover-title {
    font-size: 34px;
    line-height: 1.15;
    font-weight: 800;
    color: #111827;
    margin: 0 0 10px;
  }

  .cover-period {
    font-size: 18px;
    font-weight: 700;
    color: #0f4c81;
  }

  .cover-issue {
    display: inline-flex;
    margin-top: 10px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #8b6b1f;
    background: rgba(201, 168, 76, 0.14);
  }

  .cover-footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    padding-top: 10mm;
    border-top: 1px solid #d6b76a;
    font-size: 11px;
  }

  .cover-footer strong {
    display: block;
    margin-bottom: 4px;
    color: #8b6b1f;
  }

  .section {
    break-before: page;
    page-break-before: always;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    padding-bottom: 10px;
    margin-bottom: 18px;
    border-bottom: 2px solid #d6b76a;
  }

  .section-kicker {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.6px;
    color: #8b6b1f;
    margin-bottom: 4px;
  }

  .section-header h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.2;
    color: #0f4c81;
  }

  .section-period {
    font-size: 11px;
    font-weight: 700;
    color: #4b5563;
    white-space: nowrap;
  }

  .item {
    break-inside: avoid-page;
    page-break-inside: avoid;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid #ece6d8;
  }

  .item:last-child {
    border-bottom: 0;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .item-title {
    margin: 0 0 10px;
    font-size: 16px;
    line-height: 1.35;
    color: #0f4c81;
  }

  .item-content::after {
    content: "";
    display: table;
    clear: both;
  }

  .item-description {
    margin: 0;
    text-align: justify;
  }

  .item-description-intro {
    margin-bottom: 10px;
  }

  .item-figure {
    margin: 0 0 10px;
    break-inside: avoid-page;
    page-break-inside: avoid;
    transition: width 0.2s ease;
  }

  .item-figure-single {
    width: 72mm;
  }

  .item-figure.figure-right {
    float: right;
    margin-left: 14px;
  }

  .item-figure.figure-left {
    float: left;
    margin-right: 14px;
  }

  .item-figure.figure-full {
    float: none;
    width: 100%;
    margin: 4px 0 12px;
  }

  .item-figure.figure-full img {
    max-height: 88mm;
  }

  .item-figure.figure-bottom {
    float: none;
    width: 88mm;
    margin: 12px auto 4px;
  }

  .item-figure.figure-compact {
    width: 58mm;
  }

  .item-figure img,
  .item-figure-grid img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 58mm;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #d7dce2;
  }

  .item-figure figcaption,
  .item-figure-grid figcaption {
    margin-top: 4px;
    font-size: 10px;
    line-height: 1.4;
    color: #6b7280;
    text-align: center;
  }

  .item-gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 4px 0 12px;
    break-inside: avoid-page;
    page-break-inside: avoid;
  }

  .item-gallery.gallery-three {
    grid-template-columns: 1.15fr 0.85fr;
  }

  .item-gallery.gallery-four-plus {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .item-gallery.gallery-bottom {
    margin-top: 12px;
  }

  .item-figure-grid {
    margin: 0;
  }

  .item-figure-grid.wide {
    grid-column: 1 / -1;
  }

  .item-figure-grid img {
    max-height: 54mm;
  }

  .item-highlights {
    margin: 10px 0 0 18px;
    padding: 0;
  }

  .item-highlights li {
    margin-bottom: 4px;
    color: #1f2937;
  }

  .document-footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid #d6b76a;
    font-size: 10px;
    color: #6b7280;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  @media print {
    .cover,
    .section {
      box-shadow: none;
    }

    .item-title,
    .section-header,
    .item-figure,
    .item-gallery {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <section class="cover">
    <div class="cover-top">
      <div class="cover-brand">VNRVJIET</div>
      <div class="cover-subtitle">
        Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &amp; Technology<br />
        Department of Computer Science and Engineering
      </div>
    </div>

    <div class="cover-center">
      ${cover.bannerImageUrl ? `
        <div class="cover-banner">
          <img src="${escapeHtml(cover.bannerImageUrl)}" alt="${escapeHtml(`${monthName} ${year} newsletter banner`)}" />
        </div>
      ` : ''}
      <div class="cover-label">${escapeHtml(cover.title)}</div>
      <h1 class="cover-title">${escapeHtml(monthName)} ${escapeHtml(year)}</h1>
      <div class="cover-period">Academic updates, achievements, events, and highlights</div>
      ${cover.issue ? `<div class="cover-issue">${escapeHtml(cover.issue)}</div>` : ''}
    </div>

    <div class="cover-footer">
      <div>
        <strong>Editorial Board</strong>
        ${cover.editorialBoard.map((member) => `${escapeHtml(member)}<br />`).join('')}
      </div>
      <div>
        <strong>Address</strong>
        Vignana Jyothi Nagar, Bachupally,<br />
        Hyderabad, Telangana 500090<br />
        Dept. of CSE, VNRVJIET
      </div>
    </div>
  </section>

  ${sectionsHTML}

  <footer class="document-footer">
    <span>Dept. of CSE, VNRVJIET</span>
    <span>${escapeHtml(monthName)} ${escapeHtml(year)}</span>
  </footer>

  <script>
    window.__layoutReady = false;

    const loadImage = (img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    };

    const applyDynamicLayout = () => {
      document.querySelectorAll('.item').forEach((item) => {
        const gallery = item.querySelector('.item-gallery');
        if (gallery) {
          const figures = [...gallery.querySelectorAll('.item-figure-grid')];

          figures.forEach((figureEl) => {
            const img = figureEl.querySelector('img');
            const ratio = img && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
            figureEl.classList.toggle('wide', ratio > 1.7 && figures.length !== 2);
          });
        }
      });

      window.__layoutReady = true;
    };

    Promise.all([...document.images].map(loadImage)).then(() => {
      requestAnimationFrame(() => {
        applyDynamicLayout();
      });
    });
  </script>
</body>
</html>`;
}
