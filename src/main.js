import * as THREE from 'three';
import { roundedBox } from './geometry.js';
import { deskTex, radialTex } from './textures.js';
import { buildProps, DESK } from './props.js';
import { createAmbient } from './ambient.js';
import { setupNav, setupProjectsReveal, createPixelIntro } from './ui.js';
import { createWindow } from './window.js';
import { setupProjects } from './projects.js';

const host = document.getElementById('dc-canvas-host');

// ---------- renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe2a26c);

// Directly overhead with a narrow field of view: nearly flat, but object
// sides are faintly visible toward the edges.
const camera = new THREE.PerspectiveCamera(20, 1, 1, 200);
camera.up.set(0, 0, -1);
const FRAME = { halfX: DESK.halfX + 1.0, halfZ: DESK.halfZ + 0.5 };
function resize() {
  const w = host.clientWidth || window.innerWidth;
  const h = host.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  const half = Math.max(FRAME.halfZ, FRAME.halfX / camera.aspect);
  camera.position.set(0, half / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

// ---------- light: late-morning sun through the window on the left ----------
// Warm ambient keeps shadows a soft warm brown; a faint green fill from the
// left is light bouncing off the trees outside onto window-facing sides.
scene.add(new THREE.AmbientLight(0xffe2bf, 1.25));
const treeBounce = new THREE.DirectionalLight(0xd2dca0, 0.3);
treeBounce.position.set(-10, 1.5, 0);
scene.add(treeBounce);
const sun = new THREE.DirectionalLight(0xfff0d4, 2.4);
sun.position.set(-14, 9, -2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.shadow.intensity = 0.85;
scene.add(sun);

// ---------- desk ----------
const wood = deskTex();
wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
wood.repeat.set(1 / (DESK.halfX * 2), 1 / (DESK.halfZ * 2));
wood.offset.set(0.5, 0.5);
const desk = new THREE.Mesh(
  roundedBox(DESK.halfX * 2, 0.3, DESK.halfZ * 2),
  new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6 }),
);
desk.position.y = -0.15;
desk.receiveShadow = true;
scene.add(desk);

// ---------- props, each wrapped in a pivot centred on its footprint ----------
const { props, mug, plantClumps } = buildProps(scene);
// Warm dark-brown contact shadow, matching the wood (no cool tint).
const aoTex = radialTex('rgba(74,44,22,0.6)', 'rgba(74,44,22,0)');
const entries = props.map((prop) => {
  const box = new THREE.Box3().setFromObject(prop);
  const pivot = new THREE.Group();
  pivot.position.set((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
  scene.add(pivot);
  pivot.attach(prop);
  const hx = (box.max.x - box.min.x) / 2;
  const hz = (box.max.z - box.min.z) / 2;
  // soft contact shadow under each prop, carried along with it
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(hx * 2.5, hz * 2.5), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }));
  ao.rotation.x = -Math.PI / 2;
  ao.position.y = 0.004;
  pivot.add(ao);
  return { pivot, prop, hx, hz, body: null, opts: prop.userData.physics || {} };
});
const pivotSet = new Set(entries.map((e) => e.pivot));
const entryByPivot = new Map(entries.map((e) => [e.pivot, e]));

const updateAmbient = createAmbient(scene, { mug, plantClumps });
const updateWindow = createWindow(scene);

// ---------- input: drag any prop ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
const hit = new THREE.Vector3();
let drag = null;

function pointerOnDesk(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray.intersectPlane(plane, hit);
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!physics) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...pivotSet], true);
  if (!hits.length) return;
  let o = hits[0].object;
  while (o && !pivotSet.has(o)) o = o.parent;
  if (!o || !pointerOnDesk(e)) return;
  const entry = entryByPivot.get(o);
  const p = entry.body.translation();
  drag = { entry, targetX: hit.x, targetZ: hit.z, grabX: hit.x - p.x, grabZ: hit.z - p.z };
  renderer.domElement.setPointerCapture(e.pointerId);
  e.preventDefault();
});
window.addEventListener('pointermove', (e) => {
  if (drag && pointerOnDesk(e)) {
    drag.targetX = hit.x;
    drag.targetZ = hit.z;
  }
});
const release = () => { drag = null; };
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);

// ---------- UI layered on top ----------
setupNav();
setupProjects();
setupProjectsReveal();
const drawIntro = createPixelIntro(renderer, host);

// ---------- frame loop: input → physics → sync → render ----------
let physics = null;
let accumulator = 0;
let last = performance.now();
const clock = new THREE.Clock();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  if (physics) {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= physics.FIXED_DT && steps < 4) {
      physics.applyInput(drag);
      physics.step();
      accumulator -= physics.FIXED_DT;
      steps++;
    }
    if (steps === 4) accumulator = 0;
    physics.sync(dt);
  }

  const t = clock.getElapsedTime();
  updateAmbient(t);
  updateWindow(t);
  renderer.render(scene, camera);
  drawIntro();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Physics loads only after the first frame is on screen, so the page appears fast.
requestAnimationFrame(() => {
  requestAnimationFrame(async () => {
    const mod = await import('./physics.js');
    const world = await mod.createPhysics(entries, DESK);
    physics = { ...world, FIXED_DT: mod.FIXED_DT };
  });
});
