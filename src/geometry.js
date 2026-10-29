import * as THREE from 'three';

// Box with bevelled, rounded edges, centered on its own origin.
export function roundedBox(w, h, d) {
  const r = Math.min(0.14, Math.min(w, d) * 0.25, h * 0.45);
  const sw = w - 2 * r;
  const sd = d - 2 * r;
  const cr = Math.min(r, sw / 2, sd / 2);
  const x0 = -sw / 2;
  const y0 = -sd / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + cr, y0);
  shape.lineTo(x0 + sw - cr, y0);
  shape.quadraticCurveTo(x0 + sw, y0, x0 + sw, y0 + cr);
  shape.lineTo(x0 + sw, y0 + sd - cr);
  shape.quadraticCurveTo(x0 + sw, y0 + sd, x0 + sw - cr, y0 + sd);
  shape.lineTo(x0 + cr, y0 + sd);
  shape.quadraticCurveTo(x0, y0 + sd, x0, y0 + sd - cr);
  shape.lineTo(x0, y0 + cr);
  shape.quadraticCurveTo(x0, y0, x0 + cr, y0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, h - 2 * r),
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 2,
    curveSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// A sheet of paper lying flat, with one corner curling up a little.
export function paperGeo(w, d, curl) {
  const g = new THREE.PlaneGeometry(w, d, 14, 14);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / w + 0.5;
    const v = pos.getZ(i) / d + 0.5;
    const t = Math.max(0, u + v - 1.3) / 0.7;
    const cup = ((u - 0.5) ** 2 + (v - 0.5) ** 2) * 0.03;
    pos.setY(i, curl * t * t + cup);
  }
  g.computeVertexNormals();
  return g;
}

// Matte, flat-shaded material: chunky low-poly facets with subtle tone shifts.
export function matte(opts) {
  return new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, flatShading: true, ...opts });
}
