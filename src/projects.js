// Projects: sticky-note cards that peel off the page and expand into a
// full detail view. Edit PROJECTS to fill in real content.

export const PROJECTS = [
  {
    slug: 'project-one',
    name: 'Project One',
    summary: 'One or two sentences describing what this project does and what you built.',
    overview: 'A short overview of the project: the problem, what you made, and how it turned out.',
    tech: ['Tech one', 'Tech two', 'Tech three'],
    role: 'Your role on the project',
    live: '#',
    github: '#',
    image: null,
    video: null,
  },
  {
    slug: 'project-two',
    name: 'Project Two',
    summary: 'One or two sentences describing what this project does and what you built.',
    overview: 'A short overview of the project: the problem, what you made, and how it turned out.',
    tech: ['Tech one', 'Tech two'],
    role: 'Your role on the project',
    live: '#',
    github: '#',
    image: null,
    video: null,
  },
  {
    slug: 'project-three',
    name: 'Project Three',
    summary: 'One or two sentences describing what this project does and what you built.',
    overview: 'A short overview of the project: the problem, what you made, and how it turned out.',
    tech: ['Tech one', 'Tech two', 'Tech three', 'Tech four'],
    role: 'Your role on the project',
    live: '#',
    github: '#',
    image: null,
    video: null,
  },
  {
    slug: 'project-four',
    name: 'Project Four',
    summary: 'One or two sentences describing what this project does and what you built.',
    overview: 'A short overview of the project: the problem, what you made, and how it turned out.',
    tech: ['Tech one', 'Tech two', 'Tech three'],
    role: 'Your role on the project',
    live: '#',
    github: '#',
    image: null,
    video: null,
  },
];

// Site root: '/' locally, '/haydens-desk/' on GitHub Pages.
const BASE = import.meta.env.BASE_URL;
const projectUrl = (slug) => `${BASE}projects/${slug}`;
const slugFromPath = () => location.pathname.slice(BASE.length).match(/^projects\/([^/]+)/)?.[1];

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; // fast start, gentle settle
const FLIGHT_EASE = 'cubic-bezier(0.55, 0, 0.15, 1)'; // one continuous peel-and-grow
const FLIGHT_MS = 900;
const HOVER_CURL = 0.16;
const canHover = () => window.matchMedia('(hover: hover)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function media(p, cls) {
  const box = el('div', cls);
  if (p.video) {
    const v = el('video');
    Object.assign(v, { src: p.video, autoplay: true, muted: true, loop: true, playsInline: true });
    box.append(v);
  } else if (p.image) {
    const img = el('img');
    img.src = p.image;
    img.alt = '';
    box.append(img);
  } else {
    box.append(el('span', 'media-empty', 'Project image'));
  }
  return box;
}

function renderCard(p) {
  const card = el('article', 'card');
  card.dataset.slug = p.slug;
  card.style.setProperty('--rot', `${(Math.random() * 6 - 3).toFixed(2)}deg`);
  const body = el('div', 'card-body');
  body.append(media(p, 'thumb'), el('h3', 'card-title', p.name), el('p', 'card-desc', p.summary));
  const link = el('a', 'card-link', 'View project →');
  link.href = projectUrl(p.slug);
  body.append(link);
  card.append(body);
  return card;
}

function renderDetail(p) {
  const inner = el('div', 'detail-content');
  inner.append(media(p, 'detail-media'));
  const title = el('h2', 'detail-title', p.name);
  title.id = 'note-detail-title';
  inner.append(title, el('p', 'detail-overview', p.overview));
  const meta = el('div', 'detail-meta');
  const techBlock = el('div', 'detail-block');
  techBlock.append(el('h3', 'detail-label', 'Tech stack'));
  const tags = el('ul', 'detail-tags');
  p.tech.forEach((t) => tags.append(el('li', 'tag', t)));
  techBlock.append(tags);
  const roleBlock = el('div', 'detail-block');
  roleBlock.append(el('h3', 'detail-label', 'My role'), el('p', 'detail-role', p.role));
  meta.append(techBlock, roleBlock);
  const links = el('div', 'detail-links');
  [['Live site', p.live], ['GitHub', p.github]].forEach(([label, href]) => {
    if (!href) return;
    const a = el('a', 'detail-link', `${label} →`);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    links.append(a);
  });
  inner.append(meta, links);
  return inner;
}

function cardGeometry(card) {
  const r = card.getBoundingClientRect();
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  const rot = parseFloat(getComputedStyle(card).getPropertyValue('--rot')) || 0;
  return { w, h, cx: r.left + r.width / 2, cy: r.top + r.height / 2, rot };
}

// Transform keyframes for the whole flight, from the note on the page
// (t = 0) to a flat sheet filling the screen (t = 1). The curl starts at
// the bottom-right corner, travels diagonally toward the adhesive strip
// while the note is already rising and straightening, then flattens out
// as the note grows, so it arrives full screen as a flat sheet.
function flightFrames(g, startCurl, startRot = g.rot) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dx = vw / 2 - g.cx;
  const dy = vh / 2 - g.cy;
  const sx = vw / g.w;
  const sy = vh / g.h;
  const paper = [
    { offset: 0, transform: `translate(0px, 0px) rotate(${startRot}deg) scale(1, 1)` },
    { offset: 0.3, transform: `translate(${dx * 0.22}px, ${dy * 0.22 - 18}px) rotate(${startRot * 0.45}deg) scale(1.06, 1.06)` },
    { offset: 0.55, transform: `translate(${dx * 0.62}px, ${dy * 0.62}px) rotate(${startRot * 0.1}deg) scale(${1 + (sx - 1) * 0.18}, ${1 + (sy - 1) * 0.18})` },
    { offset: 1, transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${sx}, ${sy})` },
  ];
  const curl = [
    { offset: 0, transform: `scale(${startCurl})` },
    { offset: 0.32, transform: 'scale(0.62)' },
    { offset: 0.46, transform: 'scale(0.9)' }, // reaches the strip: the note lets go
    { offset: 0.78, transform: 'scale(0)' },
    { offset: 1, transform: 'scale(0)' },
  ];
  const face = [{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0, offset: 0.75 }, { opacity: 0 }];
  return { paper, curl, face };
}

export function setupProjects() {
  const grid = document.getElementById('projects-grid');
  const detail = document.getElementById('note-detail');
  if (!grid || !detail) return;
  const cards = PROJECTS.map((p) => {
    const c = renderCard(p);
    grid.append(c);
    return c;
  });

  let current = null; // { project, card, paper, pushed }
  let busy = false;

  const closeBtn = el('button', 'detail-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close project');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  function makePaper(card, g) {
    const paper = el('div', 'note-paper');
    const face = el('div', 'note-paper-face');
    face.append(card.querySelector('.card-body').cloneNode(true));
    const curl = el('div', 'note-curl');
    paper.append(face, curl);
    Object.assign(paper.style, { left: `${g.cx - g.w / 2}px`, top: `${g.cy - g.h / 2}px`, width: `${g.w}px`, height: `${g.h}px` });
    document.body.append(paper);
    return { paper, face, curl };
  }

  function dimOthers(card, on) {
    cards.forEach((c) => { if (c !== card) c.classList.toggle('is-dimmed', on); });
  }

  function showDetailContent(p) {
    detail.replaceChildren(closeBtn, renderDetail(p));
    detail.hidden = false;
    detail.scrollTop = 0;
    document.documentElement.classList.add('detail-open');
  }

  async function open(p, { push = true, animate = true } = {}) {
    if (busy || current) return;
    busy = true;
    const card = cards[PROJECTS.indexOf(p)];
    if (push) history.pushState({ project: p.slug }, '', projectUrl(p.slug));
    current = { project: p, card, pushed: push };

    if (!animate || reducedMotion()) {
      showDetailContent(p);
      await detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }).finished;
      closeBtn.focus();
      busy = false;
      return;
    }

    const g = cardGeometry(card);
    const { paper, face, curl } = makePaper(card, g);
    current.paper = paper;
    current.geometry = g;
    card.style.visibility = 'hidden';
    dimOthers(card, true);

    // Continue from the hover curl if there was one; touch starts flat.
    const hovered = canHover() && card.matches(':hover');
    const f = flightFrames(g, hovered ? HOVER_CURL : 0, hovered ? 0 : g.rot);
    const opts = { duration: FLIGHT_MS, easing: FLIGHT_EASE, fill: 'forwards' };
    const flight = paper.animate(f.paper, opts);
    curl.animate(f.curl, opts);
    face.animate(f.face, opts);
    await flight.finished;

    showDetailContent(p);
    const inner = detail.querySelector('.detail-content');
    inner.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
    paper.style.visibility = 'hidden';
    closeBtn.focus();
    busy = false;
  }

  async function close({ fromHistory = false } = {}) {
    if (busy || !current) return;
    // Closing from the UI walks history back so the back button stays in sync.
    if (!fromHistory && current.pushed) {
      history.back();
      return;
    }
    if (!fromHistory) history.replaceState(null, '', BASE);
    busy = true;
    const { card, paper } = current;
    const link = card.querySelector('.card-link');

    if (!paper || reducedMotion()) {
      await detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).finished;
      detail.hidden = true;
      document.documentElement.classList.remove('detail-open');
      card.style.visibility = '';
      dimOthers(card, false);
      if (paper) paper.remove();
      current = null;
      busy = false;
      link.focus({ preventScroll: true });
      return;
    }

    const inner = detail.querySelector('.detail-content');
    await inner.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished;
    detail.hidden = true;
    document.documentElement.classList.remove('detail-open');

    // Same motion in reverse: shrink, fly back, curl down from the strip to
    // the corner, then settle flat with a small bounce.
    const g = cardGeometry(card);
    const face = paper.querySelector('.note-paper-face');
    const curl = paper.querySelector('.note-curl');
    [paper, face, curl].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    Object.assign(paper.style, { left: `${g.cx - g.w / 2}px`, top: `${g.cy - g.h / 2}px`, width: `${g.w}px`, height: `${g.h}px`, visibility: '' });
    const f = flightFrames(g, 0);
    const opts = { duration: FLIGHT_MS, easing: FLIGHT_EASE, fill: 'forwards', direction: 'reverse' };
    const back = paper.animate(f.paper, opts);
    curl.animate(f.curl, opts);
    face.animate(f.face, opts);
    dimOthers(card, false);
    await back.finished;
    await paper.animate([
      { transform: `rotate(${g.rot}deg) scale(1)` },
      { transform: `rotate(${g.rot * 1.15}deg) scale(1.025)`, offset: 0.4 },
      { transform: `rotate(${g.rot}deg) scale(0.995)`, offset: 0.75 },
      { transform: `rotate(${g.rot}deg) scale(1)` },
    ], { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished;
    card.style.visibility = '';
    paper.remove();
    current = null;
    busy = false;
    link.focus({ preventScroll: true });
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    e.preventDefault();
    open(PROJECTS.find((p) => p.slug === card.dataset.slug));
  });
  closeBtn.addEventListener('click', () => close());
  detail.addEventListener('click', (e) => {
    if (!e.target.closest('.detail-content') && !e.target.closest('.detail-close')) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) close();
  });
  window.addEventListener('popstate', () => {
    const slug = slugFromPath();
    const p = PROJECTS.find((x) => x.slug === slug);
    if (current && !p) close({ fromHistory: true });
    else if (!current && p) open(p, { push: false, animate: false });
  });

  // Direct link to a project: open it straight away.
  const initial = slugFromPath();
  const initialProject = PROJECTS.find((x) => x.slug === initial);
  if (initialProject) {
    history.replaceState(null, '', BASE);
    history.pushState({ project: initialProject.slug }, '', projectUrl(initialProject.slug));
    open(initialProject, { push: false, animate: false }).then(() => { current.pushed = true; });
  }
}
