import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';

const _axis = new Vector3();

export const FIXED_DT = 1 / 60;

const ICE = {
  linearDamping: 0.6, // low: things keep gliding and slow down gradually
  angularDamping: 1.4,
  friction: 0.04,
  restitution: 0.35, // light bounce
};
const MAX_DRAG_SPEED = 14;
const DRAG_STIFFNESS = 0.35;
const FOOTPRINT_MARGIN = 0.06;
const BODY_HALF_HEIGHT = 0.5;

/**
 * Creates the physics world for the desk. Every entry is a pivot Group
 * centered on a prop's footprint; its body is a box of that footprint.
 * Bodies slide on the desk plane (Y translation locked) and may only spin
 * around the vertical axis, so they never tip, stack or leave the desk.
 */
export async function createPhysics(entries, desk) {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  world.timestep = FIXED_DT;

  // Desk edges are solid walls.
  const T = 0.5;
  const walls = [
    [-desk.halfX - T, 0, T, desk.halfZ + 2 * T],
    [desk.halfX + T, 0, T, desk.halfZ + 2 * T],
    [0, -desk.halfZ - T, desk.halfX + 2 * T, T],
    [0, desk.halfZ + T, desk.halfX + 2 * T, T],
  ];
  walls.forEach(([x, z, hx, hz]) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, BODY_HALF_HEIGHT, z));
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(hx, 2, hz).setFriction(0).setRestitution(ICE.restitution),
      body,
    );
  });

  // Mass comes from footprint size (uniform density), so the laptop barely
  // moves when a highlighter hits it, but sends a highlighter flying.
  entries.forEach((e) => {
    const o = e.opts;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(e.pivot.position.x, BODY_HALF_HEIGHT, e.pivot.position.z)
      .setLinearDamping(o.linearDamping ?? ICE.linearDamping)
      .setAngularDamping(ICE.angularDamping)
      .setCcdEnabled(true)
      .enabledRotations(false, true, false)
      .enabledTranslations(true, false, true);
    e.body = world.createRigidBody(bodyDesc);
    const shape = o.shape === 'ball'
      ? RAPIER.ColliderDesc.ball(o.radius + FOOTPRINT_MARGIN)
      : RAPIER.ColliderDesc.cuboid(e.hx + FOOTPRINT_MARGIN, BODY_HALF_HEIGHT, e.hz + FOOTPRINT_MARGIN);
    world.createCollider(
      shape
        .setDensity(o.density ?? 1)
        .setFriction(ICE.friction)
        .setRestitution(o.restitution ?? ICE.restitution),
      e.body,
    );
  });

  const rollAxis = { x: 0, y: 0, z: 0 };

  return {
    // Input stage: steer the held prop toward the pointer with a velocity,
    // so it shoves others aside but can never pass through them. Whatever
    // velocity it has when released carries on as an ice glide.
    applyInput(drag) {
      if (!drag) return;
      const p = drag.entry.body.translation();
      let vx = ((drag.targetX - drag.grabX) - p.x) / FIXED_DT * DRAG_STIFFNESS;
      let vz = ((drag.targetZ - drag.grabZ) - p.z) / FIXED_DT * DRAG_STIFFNESS;
      const speed = Math.hypot(vx, vz);
      if (speed > MAX_DRAG_SPEED) {
        vx *= MAX_DRAG_SPEED / speed;
        vz *= MAX_DRAG_SPEED / speed;
      }
      drag.entry.body.setLinvel({ x: vx, y: 0, z: vz }, true);
    },

    step() {
      world.step();
    },

    // Sync stage: copy each body's position and spin onto its pivot.
    sync(dt) {
      entries.forEach((e) => {
        const t = e.body.translation();
        const r = e.body.rotation();
        e.pivot.position.x = t.x;
        e.pivot.position.z = t.z;
        e.pivot.quaternion.set(r.x, r.y, r.z, r.w);
        // Round things visibly roll in the direction they travel.
        if (e.opts.roll) {
          const v = e.body.linvel();
          const speed = Math.hypot(v.x, v.z);
          if (speed > 0.001) {
            rollAxis.x = v.z / speed;
            rollAxis.z = -v.x / speed;
            e.prop.rotateOnWorldAxis(_axis.set(rollAxis.x, 0, rollAxis.z), (speed * dt) / e.opts.roll);
          }
        }
      });
    },
  };
}
