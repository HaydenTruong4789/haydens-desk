import * as THREE from 'three';

const FONTS = ['800 40px "Poppins"', '700 40px "Caveat"'];

// Canvas-backed texture that repaints once the web fonts finish loading, so
// labels never get stuck in a fallback face.
export function canvasTex(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const draw = () => {
    g.clearRect(0, 0, w, h);
    paint(g, w, h);
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (document.fonts && document.fonts.load) {
    Promise.all(FONTS.map((f) => document.fonts.load(f)))
      .then(() => {
        draw();
        t.needsUpdate = true;
      })
      .catch(() => {});
  }
  return t;
}

function grain(g, w, h) {
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(80,60,30,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

export function indexCardTex(lines, bg, fg) {
  return canvasTex(760, 520, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    grain(g, W, H);
    g.strokeStyle = 'rgba(214, 64, 78, 0.75)';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 92); g.lineTo(W, 92); g.stroke();
    g.strokeStyle = 'rgba(86, 140, 214, 0.45)';
    g.lineWidth = 2;
    for (let y = 148; y < H - 10; y += 56) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    g.strokeStyle = 'rgba(214, 64, 78, 0.25)';
    g.beginPath(); g.moveTo(64, 0); g.lineTo(64, H); g.stroke();
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.font = '700 120px "Caveat", "Segoe Script", cursive';
    lines.forEach((line, i) => g.fillText(line, W / 2 + 14, 248 + i * 116));
    g.strokeStyle = fg;
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(220, 400); g.quadraticCurveTo(400, 420, 560, 396); g.stroke();
    g.save();
    g.translate(650, 60);
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 4 / 5);
      g.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    }
    g.closePath();
    g.fillStyle = '#f2c14e';
    g.fill();
    g.stroke();
    g.restore();
  });
}

export function stickyTex(lines, bg, fg) {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    grain(g, W, H);
    g.fillStyle = 'rgba(0,0,0,0.06)';
    g.fillRect(0, 0, W, 70);
    const curl = g.createLinearGradient(W * 0.7, H * 0.7, W, H);
    curl.addColorStop(0, 'rgba(0,0,0,0)');
    curl.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = curl;
    g.fillRect(0, 0, W, H);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.font = '700 92px "Caveat", "Segoe Script", cursive';
    lines.forEach((line, i) => g.fillText(line, W / 2, 200 + i * 104));
  });
}

// Warm satin wood planks: subtle grain, a few knots, soft seams.
export function deskTex() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1152;
  const g = c.getContext('2d');
  const planks = 7;
  const ph = c.height / planks;
  const tones = ['#8f4423', '#9a4b28', '#a5552d', '#87401f', '#964a27'];
  for (let i = 0; i < planks; i++) {
    const y0 = i * ph;
    const base = g.createLinearGradient(0, y0, 0, y0 + ph);
    base.addColorStop(0, tones[i % tones.length]);
    base.addColorStop(0.5, tones[(i + 2) % tones.length]);
    base.addColorStop(1, tones[i % tones.length]);
    g.fillStyle = base;
    g.fillRect(0, y0, c.width, ph);
    for (let k = 0; k < 16; k++) {
      const y = y0 + 6 + Math.random() * (ph - 12);
      const amp = 2 + Math.random() * 6;
      const freq = 0.002 + Math.random() * 0.004;
      const phase = Math.random() * 10;
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '90,32,16' : '230,150,100'},${0.04 + Math.random() * 0.07})`;
      g.lineWidth = 1 + Math.random() * 2.5;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= c.width; x += 24) g.lineTo(x, y + Math.sin(x * freq + phase) * amp);
      g.stroke();
    }
    if (Math.random() < 0.45) {
      const kx = 120 + Math.random() * (c.width - 240);
      const ky = y0 + ph * (0.3 + Math.random() * 0.4);
      for (let r = 2; r > 0; r--) {
        g.strokeStyle = `rgba(80,28,14,${0.12 + r * 0.06})`;
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(kx, ky, 10 + r * 11, 5 + r * 5, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = 'rgba(70,24,12,0.55)';
      g.beginPath();
      g.ellipse(kx, ky, 9, 5, 0, 0, Math.PI * 2);
      g.fill();
    }
    const jx = 200 + Math.random() * (c.width - 400);
    g.fillStyle = 'rgba(60,22,10,0.25)';
    g.fillRect(jx, y0, 3, ph);
    g.fillStyle = 'rgba(60,22,10,0.32)';
    g.fillRect(0, y0, c.width, 4);
    g.fillStyle = 'rgba(255,200,150,0.12)';
    g.fillRect(0, y0 + 4, c.width, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function laptopScreenTex() {
  return canvasTex(512, 300, (g) => {
    g.fillStyle = '#1e2240';
    g.fillRect(0, 0, 512, 300);
    g.fillStyle = '#2b3060';
    g.fillRect(0, 0, 512, 26);
    ['#ff5f6d', '#ffc857', '#5fd38d'].forEach((col, i) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc(16 + i * 18, 13, 5, 0, Math.PI * 2);
      g.fill();
    });
    const cols = ['#ff7fb0', '#7fd6ff', '#ffd36e', '#9dff9d', '#c9a6ff'];
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let line = 0; line < 11; line++) {
      let x = 24 + (line % 3) * 18;
      const y = 46 + line * 22;
      const parts = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < parts; k++) {
        const w = 30 + rand() * 90;
        g.fillStyle = cols[(line + k) % cols.length];
        g.fillRect(x, y, w, 9);
        x += w + 12;
      }
    }
  });
}

export function latteTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a3420';
    g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(120,70,40,0)');
    rg.addColorStop(1, 'rgba(40,20,10,0.6)');
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f6e3c6';
    g.beginPath();
    g.moveTo(w / 2, h * 0.72);
    g.bezierCurveTo(w * 0.18, h * 0.5, w * 0.3, h * 0.24, w / 2, h * 0.38);
    g.bezierCurveTo(w * 0.7, h * 0.24, w * 0.82, h * 0.5, w / 2, h * 0.72);
    g.fill();
  });
}

export function radialTex(inner, outer, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
