import * as THREE from 'three';
import { matte } from './geometry.js';
import { DESK } from './props.js';

// A soft elliptical glow that fades out on every side well before the
// plane's edges, so it never shows a corner or hard line.
function softPoolTex(cx, cy, rx, ry, stops) {
  const W = 1024;
  const H = 576;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.translate(cx * W, cy * H);
  g.scale(1, (ry * H) / (rx * W));
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx * W);
  stops.forEach(([at, col]) => grad.addColorStop(at, col));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, rx * W, 0, Math.PI * 2);
  g.fill();
  return new THREE.CanvasTexture(c);
}

// The window wall along the desk's left edge: the sill, soft light pooling
// near the glass, haze, and swaying leaf shadows
// from trees outside.
export function createWindow(scene) {
  const left = -DESK.halfX;

  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, DESK.halfZ * 2 + 1.2), matte({ color: 0xf6efe2, flatShading: false }));
  sill.position.set(left - 0.45, 0.08, 0);
  sill.receiveShadow = true;
  scene.add(sill);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, DESK.halfZ * 2 + 1.2), matte({ color: 0xe8ddc9 }));
  frame.position.set(left - 0.9, 0.15, 0);
  scene.add(frame);

  // Light pooling on the desk near the window, fading toward the right.
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(DESK.halfX * 2, DESK.halfZ * 2),
    new THREE.MeshBasicMaterial({
      map: softPoolTex(0.1, 0.48, 0.62, 0.46, [[0, 'rgba(255,240,205,0.4)'], [0.3, 'rgba(255,238,202,0.24)'], [0.6, 'rgba(255,236,200,0.08)'], [1, 'rgba(255,236,200,0)']]),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.006;
  scene.add(pool);

  // Soft atmospheric haze hanging in the sunlit air by the window.
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(DESK.halfX * 2 + 4, DESK.halfZ * 2 + 3),
    new THREE.MeshBasicMaterial({
      map: softPoolTex(0.14, 0.48, 0.55, 0.42, [[0, 'rgba(255,250,236,0.3)'], [0.4, 'rgba(255,248,232,0.12)'], [1, 'rgba(255,248,232,0)']]),
      transparent: true,
      depthWrite: false,
    }),
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = 2.4;
  haze.renderOrder = 10;
  scene.add(haze);

  // Dappled leaf shadows from trees outside: a soft painted pattern near the
  // window that fades toward the room and sways a little in the breeze.
  const dappleTex = (() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 576;
    const g = c.getContext('2d');
    g.filter = 'blur(6px)';
    for (let i = 0; i < 170; i++) {
      const x = Math.random() ** 1.5 * c.width * 0.5;
      const y = Math.random() * c.height;
      const r = 10 + Math.random() * 26;
      g.fillStyle = `rgba(48,18,8,${0.2 + Math.random() * 0.16})`;
      g.beginPath();
      g.ellipse(x, y, r, r * (0.55 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.filter = 'none';
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, c.width * 0.55, 0);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  })();
  const dapples = new THREE.Mesh(
    new THREE.PlaneGeometry(DESK.halfX * 2, DESK.halfZ * 2),
    new THREE.MeshBasicMaterial({ map: dappleTex, transparent: true, depthWrite: false }),
  );
  dapples.rotation.x = -Math.PI / 2;
  dapples.position.y = 0.008;
  scene.add(dapples);

  return function update(t) {
    dappleTex.offset.set(Math.sin(t * 0.37) * 0.004, Math.sin(t * 0.5) * 0.012 + Math.sin(t * 1.3) * 0.003);
  };
}
