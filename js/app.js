/**
 * Portfolio App Logic
 * Handles gallery rendering, filtering, lightbox, and certification slider.
 * Depends on: data.js (must be loaded first)
 */

/* ===================================================================
   SVG ICON HELPERS
=================================================================== */
function placeholderIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
}

function linkIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.36-1.36"/></svg>';
}

/* ===================================================================
   GALLERY RENDERING & FILTERING
=================================================================== */
const gallery = document.getElementById('gallery');
const tabs = document.querySelectorAll('.tab');

function render(filter) {
  gallery.innerHTML = '';
  const items = filter === 'all' ? workItems : workItems.filter(i => i.category === filter);

  items.forEach((proj) => {
    const realIndex = workItems.indexOf(proj);
    const cover = proj.cover || (proj.images[0] ? proj.images[0].src : '');
    const isVideo = proj.images[0] && proj.images[0].type === 'video' && !proj.cover;
    const count = proj.images.length;

    const card = document.createElement('div');
    card.className = 'gcard' + (proj.url ? ' gcard--link' : '');

    if (proj.url) {
      card.addEventListener('click', () => window.open(proj.url, '_blank', 'noopener'));
    } else {
      card.addEventListener('click', () => openLightbox(realIndex));
    }

    let mediaInner;
    if (cover) {
      mediaInner = isVideo
        ? `<video src="${cover}" muted loop playsinline></video>`
        : `<img src="${cover}" alt="${proj.title}" loading="lazy">`;
    } else if (proj.url) {
      mediaInner = `<div class="gcard-placeholder">${linkIcon()}<span>Visit site</span></div>`;
    } else {
      mediaInner = `<div class="gcard-placeholder">${placeholderIcon()}<span>Add images</span></div>`;
    }

    card.innerHTML = `
      <div class="gcard-media${proj.coverFit === 'contain' ? ' contain' : ''}">
        <span class="gcard-cat">${proj.category}</span>
        ${count > 0 ? `<span class="img-count">${count} ${count === 1 ? 'item' : 'items'}</span>` : ''}
        ${proj.url ? `<span class="play-chip">${linkIcon()}Live site</span>` : ''}
        ${mediaInner}
      </div>
      <div class="gcard-body">
        <div class="gcard-title">${proj.title}</div>
        <div class="gcard-desc">${proj.desc}</div>
      </div>
    `;
    gallery.appendChild(card);
  });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    render(tab.dataset.filter);
  });
});

/* ===================================================================
   LIGHTBOX
=================================================================== */
const lightbox    = document.getElementById('lightbox');
const lbTitle     = document.getElementById('lbTitle');
const lbSub       = document.getElementById('lbSub');
const lbMediaWrap = document.getElementById('lbMediaWrap');
const lbCounter   = document.getElementById('lbCounter');
const lbThumbs    = document.getElementById('lbThumbs');
const lbClose     = document.getElementById('lbClose');
const lbPrev      = document.getElementById('lbPrev');
const lbNext      = document.getElementById('lbNext');

let activeProjectIndex = null;
let activeImageIndex = 0;

function openLightbox(projectIndex) {
  const proj = workItems[projectIndex];
  if (!proj.images.length) return;
  activeProjectIndex = projectIndex;
  activeImageIndex = 0;
  lbTitle.textContent = proj.title;
  lbSub.textContent = proj.desc;
  renderThumbs();
  renderStage();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function renderStage() {
  const proj = workItems[activeProjectIndex];
  const item = proj.images[activeImageIndex];
  lbMediaWrap.innerHTML = item.type === 'video'
    ? `<video src="${item.src}" controls autoplay></video>`
    : `<img src="${item.src}" alt="${proj.title}">`;
  lbCounter.textContent = `${activeImageIndex + 1} / ${proj.images.length}`;
  document.querySelectorAll('.lb-thumb').forEach((t, i) => t.classList.toggle('active', i === activeImageIndex));
}

function renderThumbs() {
  const proj = workItems[activeProjectIndex];
  lbThumbs.innerHTML = proj.images.map((item, i) => `
    <div class="lb-thumb ${i === 0 ? 'active' : ''}" data-i="${i}">
      ${item.type === 'video' ? `<video src="${item.src}" muted></video>` : `<img src="${item.src}">`}
    </div>
  `).join('');
  lbThumbs.querySelectorAll('.lb-thumb').forEach(t => {
    t.addEventListener('click', () => {
      activeImageIndex = parseInt(t.dataset.i, 10);
      renderStage();
    });
  });
}

function step(dir) {
  const proj = workItems[activeProjectIndex];
  activeImageIndex = (activeImageIndex + dir + proj.images.length) % proj.images.length;
  renderStage();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => step(-1));
lbNext.addEventListener('click', () => step(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// Initial render
render('all');

/* ===================================================================
   CERTIFICATIONS SLIDER
=================================================================== */
let certIndex = 0;
const certSlider  = document.getElementById('certSlider');
const certList    = document.getElementById('certList');
const certDots    = document.getElementById('certDots');
const certPrev    = document.getElementById('certPrev');
const certNext    = document.getElementById('certNext');
const certCounter = document.getElementById('certCounterLabel');

// Build slider images
certs.forEach((c, i) => {
  const img = document.createElement('img');
  img.src = c.src;
  img.alt = c.title;
  if (i === 0) img.classList.add('active');
  certSlider.appendChild(img);
});

// Build sidebar list
certs.forEach((c, i) => {
  const item = document.createElement('div');
  item.className = 'cert-item' + (i === 0 ? ' active' : '');
  item.innerHTML = `<span class="cert-dot"></span><span>${c.title}</span>`;
  item.addEventListener('click', () => goToCert(i));
  certList.appendChild(item);
});

// Build dots
certs.forEach((c, i) => {
  const dot = document.createElement('button');
  dot.className = 'cert-dot-btn' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToCert(i));
  certDots.appendChild(dot);
});

function goToCert(i) {
  const imgs  = certSlider.querySelectorAll('img');
  const items = certList.querySelectorAll('.cert-item');
  const dots  = certDots.querySelectorAll('.cert-dot-btn');
  imgs[certIndex].classList.remove('active');
  items[certIndex].classList.remove('active');
  dots[certIndex].classList.remove('active');
  certIndex = i;
  imgs[certIndex].classList.add('active');
  items[certIndex].classList.add('active');
  dots[certIndex].classList.add('active');
  certCounter.textContent = `${certIndex + 1} / ${certs.length}`;
}

certPrev.addEventListener('click', () => goToCert((certIndex - 1 + certs.length) % certs.length));
certNext.addEventListener('click', () => goToCert((certIndex + 1) % certs.length));

// Click cert slider to open in lightbox
certSlider.addEventListener('click', () => {
  const tempProj = {
    title: "Certifications",
    desc: certs[certIndex].title,
    images: certs.map(c => ({ type: "image", src: c.src }))
  };
  const tempIdx = workItems.length;
  workItems.push(tempProj);
  activeProjectIndex = tempIdx;
  activeImageIndex = certIndex;
  lbTitle.textContent = tempProj.title;
  lbSub.textContent = certs[certIndex].title;
  renderThumbs();
  renderStage();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose.addEventListener('click', () => workItems.splice(tempIdx, 1), { once: true });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) workItems.splice(tempIdx, 1); }, { once: true });
});

/* ===================================================================
   ACTIVE NAV HIGHLIGHT ON SCROLL
=================================================================== */
const navLinksAll = document.querySelectorAll('.nav-links a');
const sectionIds = ['work', 'services', 'experience', 'contact'];
const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const observerOptions = {
  root: null,
  rootMargin: '-30% 0px -60% 0px',
  threshold: 0
};

function setActiveNav(id) {
  navLinksAll.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${id}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActiveNav(entry.target.id);
    }
  });
}, observerOptions);

sections.forEach(section => sectionObserver.observe(section));
