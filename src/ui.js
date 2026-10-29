// HTML-side behaviour layered over the canvas: nav backing, project reveal
// with a swoosh, and the 8-bit pixel dissolve intro.

export function setupNav() {
  const nav = document.getElementById('dc-site-nav');
  const hero = document.getElementById('top');
  if (!nav || !hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => nav.classList.toggle('is-solid', !entry.isIntersecting), { threshold: 0.15 })
    .observe(hero);
}

function playSwoosh() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ac = new Ctx();
    const len = ac.sampleRate * 0.5;
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(400, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + 0.35);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, ac.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start();
    noise.stop(ac.currentTime + 0.5);
  } catch {
    // audio unavailable
  }
}

export function setupProjectsReveal() {
  const section = document.getElementById('projects-section');
  if (!section || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    playSwoosh();
    section.classList.add('revealed');
    io.disconnect();
  }, { threshold: 0.12 });
  io.observe(section);
}

// Holds on chunky pixels until the canvas size has settled for a few frames,
// then sharpens in discrete retro steps.
export function createPixelIntro(renderer, host) {
  const overlay = document.getElementById('dc-pixel-overlay');
  const loading = document.getElementById('dc-loading');
  if (!overlay) return () => {};
  const ctx = overlay.getContext('2d');
  const small = document.createElement('canvas');
  const sctx = small.getContext('2d');
  const STEPS = [40, 32, 24, 18, 13, 9, 6, 4, 3, 2, 1];
  const DURATION = 1400;
  const STABLE_NEEDED = 20;
  let lastW = 0;
  let lastH = 0;
  let stable = 0;
  let start = null;
  let done = false;

  return function draw() {
    if (done) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h || !renderer.domElement.width || !renderer.domElement.height) return;
    if (w !== lastW || h !== lastH) {
      lastW = w;
      lastH = h;
      overlay.width = w;
      overlay.height = h;
      stable = 0;
    } else if (start === null && ++stable >= STABLE_NEEDED) {
      start = performance.now();
      if (loading) loading.style.display = 'none';
    }
    const progress = start === null ? 0 : Math.min((performance.now() - start) / DURATION, 1);
    if (progress >= 1) {
      overlay.style.display = 'none';
      done = true;
      return;
    }
    const block = STEPS[Math.min(STEPS.length - 1, Math.floor(progress * progress * STEPS.length))];
    const sw = Math.max(1, Math.ceil(w / block));
    const sh = Math.max(1, Math.ceil(h / block));
    small.width = sw;
    small.height = sh;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(renderer.domElement, 0, 0, renderer.domElement.width, renderer.domElement.height, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, sw * block, sh * block);
    overlay.style.display = 'block';
  };
}
