import * as THREE from 'three';
import { easeInOutCubic } from '../utils/MathUtils.js';

// ── CAMERA PATH CONTROL POINTS ──────────────────────────────────────────────
// Edit these vectors to change the flight path.
// t values are approximate — the curve interpolates between them smoothly.

const POSITION_POINTS = [
  new THREE.Vector3(  0,   8,  60),  // t≈0.00  Hero: low, facing mountain range
  new THREE.Vector3(  0,  12,  38),  // t≈0.14  Approaching the mountain gap
  new THREE.Vector3( -8,  10,  14),  // t≈0.25  Left of left peak, entering pass
  new THREE.Vector3(  6,   9,  -2),  // t≈0.33  Right of right peak, tight corridor
  new THREE.Vector3(  0,  14, -18),  // t≈0.42  Exiting pass, cloud bank begins
  new THREE.Vector3(  0,  20, -38),  // t≈0.50  Deep inside cloud bank (peak fog)
  new THREE.Vector3(  0,  80, -55),  // t≈0.60  Burst out above clouds, drone height
  new THREE.Vector3( 18,  68, -80),  // t≈0.70  Pan right, forest canopy below
  new THREE.Vector3(  0,  45, -105), // t≈0.80  Descent begins, forest closer
  new THREE.Vector3(  0,  22, -128), // t≈0.90  Near ground level, logo approach
  new THREE.Vector3(  0,  18, -140), // t≈1.00  Footer: stationary resting position
];

const LOOKAT_POINTS = [
  new THREE.Vector3(  0,   4,   0),  // Look at mountain range center
  new THREE.Vector3(  0,   8,   0),  // Look toward the mountain gap
  new THREE.Vector3(  0,   8, -12),  // Look through the pass
  new THREE.Vector3(  0,   9, -25),  // Look ahead into cloud
  new THREE.Vector3(  0,  12, -45),  // Look into cloud bank ahead
  new THREE.Vector3(  0,  18, -60),  // Look further into clouds
  new THREE.Vector3(  0,   0, -65),  // Look DOWN at forest (drone shot)
  new THREE.Vector3(  8,  15, -98),  // Look down-forward right
  new THREE.Vector3(  0,  18, -115), // Look toward ground ahead
  new THREE.Vector3(  0,  20, -130), // Look toward logo position
  new THREE.Vector3(  0,  20, -142), // Footer: look straight ahead
];

export function createCameraRig(camera) {
  const positionCurve = new THREE.CatmullRomCurve3(POSITION_POINTS);
  const lookAtCurve   = new THREE.CatmullRomCurve3(LOOKAT_POINTS);

  // Current smooth lookAt target (lerped toward)
  const currentLookAt = new THREE.Vector3();

  // Target vectors to avoid allocation inside RAF
  const targetPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();

  // Mouse offset injected by MouseParallax.js (only active in footer)
  let mouseOffset = { x: 0, y: 0 };

  // Current scroll progress (0→1)
  let scrollProgress = 0;

  function setProgress(p) {
    scrollProgress = p;
  }

  function setMouseOffset(x, y) {
    mouseOffset = { x, y };
  }

  // Call every frame from SceneManager RAF
  function update(delta) {
    // Smooth the raw progress for cinematic camera lag
    const smoothT = easeInOutCubic(scrollProgress);

    positionCurve.getPoint(smoothT, targetPos);
    lookAtCurve.getPoint(smoothT, targetLook);

    // Camera position: lerp with slight lag for weight
    camera.position.lerp(targetPos, 0.055);

    // LookAt: lerp separately so camera "turns" slightly after position
    currentLookAt.lerp(targetLook, 0.07);
    camera.lookAt(currentLookAt);

    // FOV: compress in mountain pass (t 0.22→0.38) for claustrophobia
    const targetFOV = getMountainFOV(scrollProgress);
    camera.fov += (targetFOV - camera.fov) * 0.04;
    camera.updateProjectionMatrix();

    // Mouse parallax: only in footer (t > 0.88), blend in smoothly
    if (scrollProgress > 0.88) {
      const blend = Math.min((scrollProgress - 0.88) / 0.12, 1);
      camera.position.x += mouseOffset.x * 3.0 * blend;
      camera.position.y += mouseOffset.y * 1.5 * blend;
    }
  }

  function getMountainFOV(t) {
    if (t >= 0.22 && t <= 0.38) {
      const localT = (t - 0.22) / 0.16;
      return 60 - Math.sin(localT * Math.PI) * 14;  // 60 → 46 → 60
    }
    return 60;
  }

  return { update, setProgress, setMouseOffset };
}
