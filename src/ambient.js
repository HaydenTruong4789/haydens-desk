import * as THREE from 'three';
import { matte } from './geometry.js';
import { radialTex } from './textures.js';

const softTex = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64);

// Steam, sunlit dust, drifting autumn leaves and a swaying plant.
export function createAmbient(scene, { mug, plantClumps }) {
  const steam = [];
  for (let i = 0; i < 12; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xfff4e6, transparent: true, depthWrite: false, opacity: 0 }));
    sp.userData.phase = i / 12;
    sp.userData.wob = Math.random() * Math.PI * 2;
    scene.add(sp);
    steam.push(sp);
  }

  // Dust drifting in the sunlit air near the window on the left.
  const MOTES = 90;
  const motePos = new Float32Array(MOTES * 3);
  const moteSeed = [];
  for (let i = 0; i < MOTES; i++) {
    motePos[i * 3] = -8.4 + Math.random() ** 1.6 * 6;
    motePos[i * 3 + 1] = 0.5 + Math.random() * 4;
    motePos[i * 3 + 2] = -4.6 + Math.random() * 9.2;
    moteSeed.push(Math.random() * Math.PI * 2);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  scene.add(new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xfff4dc, size: 0.08, map: softTex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  })));

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.28);
  leafShape.quadraticCurveTo(0.22, -0.05, 0, 0.3);
  leafShape.quadraticCurveTo(-0.22, -0.05, 0, -0.28);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 6);
  const leaves = [0xd9622b, 0xe8a33d, 0xc2452d, 0xf0b84a, 0xb8502a, 0xe07b34].map((col) => {
    const leaf = new THREE.Mesh(leafGeo, matte({ color: col, side: THREE.DoubleSide }));
    leaf.castShadow = true;
    leaf.userData = {
      speed: 0.008 + Math.random() * 0.008,
      drift: 0.002 + Math.random() * 0.004,
      spin: new THREE.Vector3(Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.02),
      wob: Math.random() * Math.PI * 2,
      baseY: 1.4 + Math.random() * 2.2,
    };
    leaf.position.set(-10 + Math.random() * 20, leaf.userData.baseY, -4 + Math.random() * 7);
    leaf.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    scene.add(leaf);
    return leaf;
  });

  const mugPos = new THREE.Vector3();

  return function update(t) {
    for (let i = 0; i < MOTES; i++) {
      motePos[i * 3 + 1] += 0.004;
      motePos[i * 3] += Math.sin(t * 0.6 + moteSeed[i]) * 0.003;
      if (motePos[i * 3 + 1] > 4.5) motePos[i * 3 + 1] = 0.5;
    }
    moteGeo.attributes.position.needsUpdate = true;

    plantClumps.forEach((cl) => {
      cl.rotation.x = Math.sin(t * 0.9 + cl.userData.phase) * 0.035;
      cl.rotation.z = Math.cos(t * 0.75 + cl.userData.phase) * 0.03;
    });

    mug.getWorldPosition(mugPos);
    steam.forEach((sp) => {
      const life = (t * 0.22 + sp.userData.phase) % 1;
      sp.position.set(
        mugPos.x + Math.sin(t * 1.3 + sp.userData.wob + life * 4) * 0.12 * life,
        mugPos.y + 0.35 + life * 1.8,
        mugPos.z + Math.cos(t * 1.1 + sp.userData.wob) * 0.08 * life,
      );
      const sc = 0.35 + life * 0.9;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.sin(Math.PI * life) * 0.32;
    });

    leaves.forEach((leaf) => {
      const u = leaf.userData;
      leaf.position.x += u.speed;
      leaf.position.z += u.drift;
      leaf.position.y = u.baseY + Math.sin(t * 0.8 + u.wob) * 0.35;
      leaf.rotation.x += u.spin.x;
      leaf.rotation.y += u.spin.y;
      leaf.rotation.z += u.spin.z;
      if (leaf.position.x > 10.5 || leaf.position.z > 6) leaf.position.set(-10.5, u.baseY, -4.5 + Math.random() * 6);
    });
  };
}
