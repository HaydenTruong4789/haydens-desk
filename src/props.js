import * as THREE from 'three';
import { roundedBox, paperGeo, matte } from './geometry.js';
import { canvasTex, indexCardTex, stickyTex, laptopScreenTex, latteTex } from './textures.js';

export const DESK = { halfX: 8, halfZ: 4.5 };

// One small warm palette shared by every object.
const C = {
  cream: 0xf3e6cf,
  honey: 0xf2c14e,
  orange: 0xd9783f,
  terra: 0xc4613d,
  espresso: 0x4a2f24,
  espresso2: 0x3a241c,
  sage: 0x8fb89a,
  metal: 0xd8cbb8,
};

function labelPlane(w, h, tex) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), matte({ map: tex, transparent: true, flatShading: false }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function box(w, h, d, color, extra) {
  return new THREE.Mesh(roundedBox(w, h, d), matte({ color, ...extra }));
}

function laptop() {
  const base = box(2.6, 0.12, 1.8, C.metal, { roughness: 0.55 });
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.06, -0.86);
  hinge.rotation.x = -1.15;
  base.add(hinge);
  const lid = box(2.6, 1.6, 0.08, C.metal, { roughness: 0.55 });
  lid.position.set(0, 0.8, 0);
  hinge.add(lid);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.38), new THREE.MeshBasicMaterial({ map: laptopScreenTex() }));
  display.position.set(0, 0.8, 0.05);
  hinge.add(display);
  const deck = box(2.2, 0.03, 0.75, C.espresso);
  deck.position.set(0, 0.07, -0.12);
  base.add(deck);
  const keyGeo = roundedBox(0.15, 0.03, 0.13);
  const keyMat = matte({ color: C.espresso2 });
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const k = new THREE.Mesh(keyGeo, keyMat);
      k.position.set(-0.96 + col * 0.175, 0.095, -0.4 + row * 0.17);
      base.add(k);
    }
  }
  [[-0.7, 0.42, C.honey], [0.72, 0.4, C.orange]].forEach(([x, z, col]) => {
    const sticker = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), matte({ color: col }));
    sticker.position.set(x, 0.07, z);
    base.add(sticker);
  });
  const trackpad = box(0.85, 0.03, 0.45, C.cream);
  trackpad.position.set(0, 0.07, 0.55);
  base.add(trackpad);
  base.position.set(-4.6, 0.06, 3.0);
  return base;
}

function keyboard() {
  const kb = box(2.6, 0.1, 1.1, C.espresso);
  const keyGeo = roundedBox(0.15, 0.05, 0.17);
  const mats = {
    key: matte({ color: C.cream }),
    esc: matte({ color: C.orange }),
    enter: matte({ color: C.honey }),
    mod: matte({ color: C.sage }),
  };
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 13; col++) {
      let m = mats.key;
      if (row === 0 && col === 0) m = mats.esc;
      else if (row === 1 && col === 12) m = mats.enter;
      else if (row === 3 && (col === 0 || col === 12)) m = mats.mod;
      const key = new THREE.Mesh(keyGeo, m);
      key.position.set(-1.14 + col * 0.19, 0.07, -0.33 + row * 0.22);
      kb.add(key);
    }
  }
  const space = new THREE.Mesh(roundedBox(1.1, 0.05, 0.17), mats.key);
  space.position.set(0, 0.07, 0.48);
  kb.add(space);
  kb.position.set(-0.4, 0.05, 3.5);
  return kb;
}

function hexStick(len, r, color, tipColor) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), matte({ color }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, r * 4, 6), matte({ color: 0xf1c896 }));
  tip.position.y = len / 2 + r * 2;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, r * 1.3, 6), matte({ color: tipColor }));
  lead.position.y = len / 2 + r * 3.5;
  body.add(tip, lead);
  return body;
}

function penCup() {
  const cup = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.95, 18, 1, true), matte({ color: C.terra, side: THREE.DoubleSide }));
  wall.position.y = 0.475;
  const inside = new THREE.Mesh(new THREE.CircleGeometry(0.47, 18), matte({ color: 0x2a1812 }));
  inside.rotation.x = -Math.PI / 2;
  inside.position.y = 0.32;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.045, 6, 22), matte({ color: 0xd9744a }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.95;
  cup.add(wall, inside, rim);

  const lean = (obj, x, z, tiltX, tiltZ, y) => {
    obj.position.set(x, y, z);
    obj.rotation.set(tiltX, 0, tiltZ);
    cup.add(obj);
  };
  lean(hexStick(1.5, 0.05, C.honey, C.espresso2), -0.18, -0.12, -0.28, 0.22, 0.95);
  lean(hexStick(1.15, 0.05, C.sage, C.espresso2), 0.2, -0.2, -0.32, -0.3, 0.8);

  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 1.35, 10), matte({ color: C.espresso }));
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.03), matte({ color: C.honey }));
  clip.position.set(0.06, 0.5, 0);
  const penCap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matte({ color: C.honey }));
  penCap.position.y = 0.68;
  pen.add(clip, penCap);
  lean(pen, 0.05, 0.22, 0.3, -0.12, 0.9);

  const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.3, 8), matte({ color: C.cream }));
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.16, 8), matte({ color: C.metal }));
  ferrule.position.y = 0.72;
  const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 8), matte({ color: 0x2a1812 }));
  bristles.position.y = 0.9;
  brush.add(ferrule, bristles);
  lean(brush, -0.24, 0.16, 0.22, 0.34, 0.9);

  const rulerTex = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#f2c14e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a2f24';
    for (let y = 8; y < h; y += 16) g.fillRect(0, y, y % 64 === 8 ? 26 : 14, 3);
  });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.6, 0.03), matte({ map: rulerTex, flatShading: false }));
  lean(ruler, 0.26, 0.05, 0.05, -0.42, 1.0);

  const scissors = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.025), matte({ color: C.metal, roughness: 0.4 }));
  scissors.add(blade);
  [-0.09, 0.09].forEach((dx) => {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 14), matte({ color: C.orange }));
    loop.position.set(dx, 0.55, 0);
    scissors.add(loop);
  });
  lean(scissors, -0.02, -0.28, -0.4, 0.05, 0.75);

  const hl = highlighter(C.orange, 0, 0, 0);
  hl.rotation.set(0.18, 0, -0.25);
  hl.position.set(0.12, 0.85, 0.02);
  cup.add(hl);

  cup.position.set(4.8, 0, 3.0);
  return cup;
}

function mug() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.55, 14), matte({ color: C.cream, roughness: 0.5 }));
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 20), matte({ map: latteTex(), flatShading: false }));
  coffee.position.set(0, 0.26, 0);
  m.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 14, Math.PI), matte({ color: C.cream, roughness: 0.5 }));
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.42, 0, 0);
  m.add(handle);
  m.position.set(4.0, 0.28, -3.2);
  return m;
}

function pencil() {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.3, 6), matte({ color: C.honey }));
  const parts = [
    [new THREE.CylinderGeometry(0.052, 0.052, 0.14, 10), C.terra, 0.73, false],
    [new THREE.CylinderGeometry(0.058, 0.058, 0.1, 10), C.metal, 0.62, false],
    [new THREE.ConeGeometry(0.055, 0.22, 6), 0xf1c896, -0.76, true],
    [new THREE.ConeGeometry(0.018, 0.07, 6), C.espresso2, -0.86, true],
  ];
  parts.forEach(([geo, col, y, flip]) => {
    const m = new THREE.Mesh(geo, matte({ color: col }));
    m.position.y = y;
    if (flip) m.rotation.x = Math.PI;
    p.add(m);
  });
  p.rotation.z = Math.PI / 2;
  p.rotation.y = Math.PI / 2 + 0.08;
  p.position.set(-7.25, 0.06, 1.85);
  return p;
}

function sticky(lines, bg, x, z, rot, curl) {
  const s = new THREE.Mesh(paperGeo(1.0, 1.0, curl), matte({ map: stickyTex(lines, bg, '#4a2f24'), flatShading: false, side: THREE.DoubleSide }));
  s.position.set(x, 0.03, z);
  s.rotation.y = rot;
  return s;
}

function calculator() {
  const calc = box(1.0, 0.08, 1.5, C.espresso);
  const bezel = box(0.86, 0.03, 0.38, C.espresso2);
  bezel.position.set(0, 0.05, -0.5);
  calc.add(bezel);
  const lcd = labelPlane(0.76, 0.28, canvasTex(380, 140, (g, w, h) => {
    g.fillStyle = '#efe1b0'; g.fillRect(0, 0, w, h);
    g.font = '700 84px "Poppins", Arial, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(74,47,36,0.1)'; g.fillText('88888', w - 18, h / 2 + 6);
    g.fillStyle = '#4a2f24'; g.fillText('1337', w - 18, h / 2 + 6);
  }));
  lcd.position.set(0, 0.068, -0.5);
  calc.add(lcd);
  const rows = [['C', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '.', '⌫', '=']];
  const btnGeo = roundedBox(0.18, 0.04, 0.15);
  const mats = { num: matte({ color: C.cream }), fn: matte({ color: C.sage }), op: matte({ color: C.orange }), eq: matte({ color: C.honey }) };
  rows.forEach((row, r) => {
    row.forEach((label, ci) => {
      const kind = label === '=' ? 'eq' : ci === 3 ? 'op' : r === 0 ? 'fn' : 'num';
      const bx = -0.33 + ci * 0.22;
      const bz = -0.16 + r * 0.18;
      const btn = new THREE.Mesh(btnGeo, mats[kind]);
      btn.position.set(bx, 0.06, bz);
      calc.add(btn);
      const txt = labelPlane(0.16, 0.13, canvasTex(96, 80, (g, w, h) => {
        g.fillStyle = kind === 'op' ? '#fbf6ee' : '#4a2f24';
        g.font = '700 58px "Poppins", Arial, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(label, w / 2, h / 2 + 3);
      }));
      txt.position.set(bx, 0.082, bz);
      calc.add(txt);
    });
  });
  const solar = box(0.36, 0.02, 0.1, C.espresso2);
  solar.position.set(0.22, 0.05, -0.7);
  calc.add(solar);
  calc.position.set(3.2, 0.04, 3.4);
  calc.rotation.y = 0.05;
  return calc;
}

function baseball() {
  const R = 0.34;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 18, 14), matte({ color: 0xf4ecdc, flatShading: false, roughness: 0.75 }));
  // The classic seam: one closed curve looping over the ball in two lobes.
  const seam = (t) => {
    const p = new THREE.Vector3(
      Math.cos(t) * 0.75 + Math.cos(3 * t) * 0.25,
      Math.sin(2 * t) * 0.65,
      Math.sin(t) * 0.75 - Math.sin(3 * t) * 0.25,
    );
    return p.normalize().multiplyScalar(R * 1.005);
  };
  const red = matte({ color: 0xc23a2a, flatShading: false });
  const N = 160;
  const offsetCurve = (side) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const p = seam(t);
      const tan = seam(t + 0.001).sub(p).normalize();
      const out = p.clone().normalize();
      const s = new THREE.Vector3().crossVectors(tan, out).normalize();
      pts.push(p.clone().addScaledVector(s, side * 0.03).normalize().multiplyScalar(R * 1.01));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  };
  [-1, 1].forEach((side) => {
    ball.add(new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(side), 160, 0.008, 4, true), red));
  });
  // small V-shaped stitches straddling the seam
  const stitchGeo = new THREE.BoxGeometry(0.008, 0.008, 0.05);
  const STITCHES = 44;
  for (let i = 0; i < STITCHES; i++) {
    const t = (i / STITCHES) * Math.PI * 2;
    const p = seam(t);
    const tan = seam(t + 0.001).sub(p).normalize();
    const out = p.clone().normalize();
    const s = new THREE.Vector3().crossVectors(tan, out).normalize();
    [-1, 1].forEach((side) => {
      const st = new THREE.Mesh(stitchGeo, red);
      const dir = s.clone().multiplyScalar(side).addScaledVector(tan, 0.7).normalize();
      st.position.copy(p).addScaledVector(s, side * 0.026).addScaledVector(out, 0.004);
      st.lookAt(st.position.clone().add(dir));
      ball.add(st);
    });
  }
  ball.position.set(-6.9, R, 3.6);
  // Round and light: rolls and slides further than everything else.
  ball.userData.physics = { shape: 'ball', radius: R, density: 0.45, linearDamping: 0.22, restitution: 0.6, roll: R };
  return ball;
}

function lamp() {
  const g = new THREE.Group();
  const mat = matte({ color: C.sage });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 14), mat);
  base.position.y = 0.07;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.9, 8), mat);
  post.position.y = 1.0;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 8), mat);
  arm.position.set(0.6, 1.95, 0.3);
  arm.rotation.set(0, -0.45, Math.PI / 2 - 0.25);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 14, 1, true), matte({ color: C.sage, side: THREE.DoubleSide }));
  head.position.set(1.3, 1.75, 0.6);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), matte({ color: C.cream }));
  bulb.position.set(1.3, 1.5, 0.6);
  g.add(base, post, arm, head, bulb);
  g.position.set(-6.6, 0, -3.5);
  return g;
}

// Potted plant: 3-4 soft, overlapping clumps of fewer, larger, rounded
// leaves for a smooth silhouette, shaded light on the sun side and deep
// green in the interior. No emissive rims, no stray leaves.
function plant(clumps) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.7, 14), matte({ color: C.terra }));
  pot.position.y = 0.35;
  g.add(pot);
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.2);
  shape.bezierCurveTo(0.2, -0.18, 0.2, 0.14, 0, 0.22);
  shape.bezierCurveTo(-0.2, 0.14, -0.2, -0.18, 0, -0.2);
  const leafGeo = new THREE.ShapeGeometry(shape, 8);
  const mats = {
    light: matte({ color: 0xb9d56c, side: THREE.DoubleSide, flatShading: false }),
    mid: matte({ color: 0x77ab4f, side: THREE.DoubleSide, flatShading: false }),
    deep: matte({ color: 0x3d6b38, side: THREE.DoubleSide, flatShading: false }),
  };
  const sunDir = new THREE.Vector3(-14, 9, -2).normalize();
  const pick = (n, depth) => {
    if (depth < 0.8) return mats.deep;
    const d = n.dot(sunDir);
    if (d > 0.25) return mats.light;
    if (d > -0.25) return mats.mid;
    return mats.deep;
  };
  [[0, 0, 0.5, 1.0], [0.42, 0.22, 0.42, 0.9], [-0.4, 0.2, 0.42, 0.92], [0.05, -0.42, 0.4, 0.9]].forEach(([cx, cz, r, cy], ci) => {
    const clump = new THREE.Group();
    clump.position.set(cx, cy, cz);
    clump.userData.phase = ci * 1.3;
    const COUNT = 22;
    for (let i = 0; i < COUNT; i++) {
      // evenly spread over the upper dome so the clump outline stays smooth
      const yN = 1 - (i + 0.5) / COUNT * 1.15;
      const ring = Math.sqrt(Math.max(0, 1 - yN * yN));
      const a = i * 2.39996;
      const n = new THREE.Vector3(Math.cos(a) * ring, yN, Math.sin(a) * ring).normalize();
      const depth = i % 5 === 4 ? 0.7 : 0.9 + Math.random() * 0.08;
      const leaf = new THREE.Mesh(leafGeo, pick(n, depth));
      leaf.position.copy(n).multiplyScalar(r * depth);
      leaf.lookAt(n.clone().multiplyScalar(r * 3));
      leaf.rotateZ(a);
      leaf.scale.setScalar(1.25 + Math.random() * 0.25);
      clump.add(leaf);
    }
    g.add(clump);
    clumps.push(clump);
  });
  return g;
}

function pageEdgeTex() {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#f6ecd6';
    g.fillRect(0, 0, w, h);
    for (let y = 3; y < h; y += 4) {
      g.fillStyle = `rgba(150,120,80,${0.18 + Math.random() * 0.15})`;
      g.fillRect(0, y, w, 1);
    }
  });
}

function hardcover(w, d, thick, color) {
  const book = new THREE.Group();
  const board = 0.035;
  const coverMat = matte({ color });
  const pagesMat = matte({ map: pageEdgeTex(), flatShading: false });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, thick - board * 2, d - 0.1), pagesMat);
  pages.position.set(0.04, thick / 2, 0);
  const top = new THREE.Mesh(roundedBox(w, board, d), coverMat);
  top.position.y = thick - board / 2;
  const bottom = new THREE.Mesh(roundedBox(w, board, d), coverMat);
  bottom.position.y = board / 2;
  // rounded spine down the left side
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(thick / 2, thick / 2, d, 12, 1, false, Math.PI, Math.PI), coverMat);
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-w / 2 + 0.02, thick / 2, 0);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(thick / 2 + 0.004, thick / 2 + 0.004, 0.06, 12, 1, false, Math.PI, Math.PI), matte({ color: C.cream }));
  band.rotation.x = Math.PI / 2;
  band.position.set(-w / 2 + 0.02, thick / 2, d * 0.3);
  book.add(pages, top, bottom, spine, band);
  return book;
}

function books() {
  const g = new THREE.Group();
  const stack = [
    [2.1, 1.5, 0.26, C.terra, 0, 0, 0],
    [1.85, 1.3, 0.22, C.sage, 0.1, 0.06, 0.13],
    [1.6, 1.12, 0.2, C.honey, -0.06, -0.04, -0.1],
  ];
  let y = 0;
  stack.forEach(([w, d, thick, col, ox, oz, rot]) => {
    const b = hardcover(w, d, thick, col);
    b.position.set(ox, y, oz);
    b.rotation.y = rot;
    g.add(b);
    y += thick;
  });
  return g;
}

function highlighter(col, x, z, rot) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.85, 12), matte({ color: col }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12), matte({ color: C.espresso }));
  cap.position.y = 0.5;
  body.add(cap);
  body.rotation.set(0, rot, Math.PI / 2);
  body.position.set(x, 0.13, z);
  return body;
}

// Decorative only: tucked under the desk's right edge, not part of physics.
function trashCan() {
  const mat = matte({ color: C.espresso, side: THREE.DoubleSide });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 1.1, 14, 1, true), mat);
  can.scale.setScalar(2.1);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.42, 14), mat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -0.55;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 6, 20), matte({ color: C.espresso2 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.55;
  can.add(bottom, rim);
  [
    [new THREE.IcosahedronGeometry(0.17, 0), C.cream, [-0.15, 0.5, 0.1]],
    [new THREE.IcosahedronGeometry(0.14, 0), 0xe8e0c8, [0.18, 0.46, -0.12]],
    [new THREE.ConeGeometry(0.1, 0.22, 8), 0xd4c9a0, [0.05, 0.6, 0.2]],
    [roundedBox(0.18, 0.1, 0.24), C.orange, [-0.2, 0.44, -0.2]],
    [new THREE.SphereGeometry(0.1, 8, 8), C.honey, [0.22, 0.52, 0.18]],
  ].forEach(([geo, col, p]) => {
    const piece = new THREE.Mesh(geo, matte({ color: col }));
    piece.position.set(p[0], p[1], p[2]);
    piece.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    can.add(piece);
  });
  can.position.set(8.4, -1.55, -0.3);
  return can;
}

function footprint(obj) {
  obj.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(obj);
}

export function buildProps(scene) {
  const plantClumps = [];
  const lampObj = lamp();
  const plantObj = plant(plantClumps);
  const booksObj = books();
  const mugObj = mug();

  const props = [
    laptop(), keyboard(), penCup(), mugObj, pencil(),
    sticky(['call back', 're: design'], '#ffe27a', 7.0, 0.6, 0.08, 0.12),
    sticky(['todo:', 'ship it!'], '#ffd9a0', 7.0, -1.0, -0.1, 0.1),
    calculator(), baseball(), lampObj, plantObj, booksObj,
    highlighter(C.sage, 6.6, 2.3, 0.04), highlighter(C.honey, 6.6, 2.95, -0.05),
  ];
  props.forEach((p) => scene.add(p));

  // Plant sits just below the lamp, almost touching, so they read as a pair.
  const lampBox = footprint(lampObj);
  const plantBox = footprint(plantObj);
  plantObj.position.x += (lampBox.min.x + lampBox.max.x) / 2 - (plantBox.min.x + plantBox.max.x) / 2;
  plantObj.position.z += lampBox.max.z + 0.08 - plantBox.min.z;

  // Books tucked into the top-right corner, fully on the desk.
  const booksBox = footprint(booksObj);
  booksObj.position.x += DESK.halfX - 0.35 - booksBox.max.x;
  booksObj.position.z += -DESK.halfZ + 0.35 - booksBox.min.z;

  props.forEach((p) => p.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  }));

  const note = new THREE.Mesh(
    paperGeo(1.9, 1.3, 0.09),
    matte({ map: indexCardTex(["Hayden's", 'Desk'], '#fbf7ec', '#2b2114'), flatShading: false, side: THREE.DoubleSide }),
  );
  note.position.set(0, 0.035, -1.0);
  note.rotation.y = -0.08;
  note.castShadow = true;
  note.receiveShadow = true;
  scene.add(note);

  const trash = trashCan();
  trash.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(trash);

  return { props, note, mug: mugObj, plantClumps };
}
