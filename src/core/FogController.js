import * as THREE from 'three';
import { clamp01 } from '../utils/MathUtils.js';

// Scene lighting table — lerp between these as progress crosses boundaries
const SCENE_STATES = [
  { t: 0.00, fog: 0x03050a, density: 0.004, exp: 1.00, amb: 0x1a2040, ambI: 0.40 },
  { t: 0.20, fog: 0x060810, density: 0.010, exp: 0.85, amb: 0x1a2040, ambI: 0.22 },
  { t: 0.38, fog: 0x8fa8cc, density: 0.030, exp: 1.40, amb: 0xffffff, ambI: 0.90 },
  { t: 0.47, fog: 0x8fa8cc, density: 0.038, exp: 1.50, amb: 0xffffff, ambI: 1.00 },  // cloud peak
  { t: 0.55, fog: 0x0a1a0f, density: 0.004, exp: 1.30, amb: 0x1a3020, ambI: 0.50 },
  { t: 0.75, fog: 0x0a1208, density: 0.005, exp: 1.20, amb: 0x1a2010, ambI: 0.50 },
  { t: 0.88, fog: 0x03050a, density: 0.008, exp: 1.00, amb: 0x0a0818, ambI: 0.30 },
  { t: 1.00, fog: 0x03050a, density: 0.008, exp: 1.00, amb: 0x0a0818, ambI: 0.30 },
];

export const FogController = {
  // Pre-allocated colors to avoid GC pauses during scroll
  _fogColorStart: new THREE.Color(),
  _fogColorEnd: new THREE.Color(),
  _ambColorStart: new THREE.Color(),
  _ambColorEnd: new THREE.Color(),

  update(progress, scene, renderer, ambientLight) {
    if (!scene || !scene.fog) return;

    const p = clamp01(progress);

    // Find surrounding keyframes
    let startIndex = 0;
    let endIndex = 0;

    for (let i = 0; i < SCENE_STATES.length - 1; i++) {
      if (p >= SCENE_STATES[i].t && p <= SCENE_STATES[i + 1].t) {
        startIndex = i;
        endIndex = i + 1;
        break;
      }
    }

    const start = SCENE_STATES[startIndex];
    const end = SCENE_STATES[endIndex];

    // Calculate local interpolation factor
    let localT = 0;
    if (end.t > start.t) {
      localT = (p - start.t) / (end.t - start.t);
    }

    // 1. Fog Color
    this._fogColorStart.setHex(start.fog);
    this._fogColorEnd.setHex(end.fog);
    scene.fog.color.lerpColors(this._fogColorStart, this._fogColorEnd, localT);

    // 2. Fog Density
    scene.fog.density = start.density + (end.density - start.density) * localT;

    // 3. Renderer Exposure
    renderer.toneMappingExposure = start.exp + (end.exp - start.exp) * localT;

    // 4. Ambient Light (if provided)
    if (ambientLight) {
      this._ambColorStart.setHex(start.amb);
      this._ambColorEnd.setHex(end.amb);
      ambientLight.color.lerpColors(this._ambColorStart, this._ambColorEnd, localT);
      ambientLight.intensity = start.ambI + (end.ambI - start.ambI) * localT;
    }
  }
};
