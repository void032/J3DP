import * as THREE from 'three';
import { SkyDome } from '../objects/SkyDome.js';
import { Mountains } from '../objects/Mountains.js';
import { Particles } from '../objects/Particles.js';

export const HeroScene = {
  init(scene, renderer) {
    this.objects = [];

    // Sky
    const skyDome = new SkyDome();
    scene.add(skyDome.mesh);
    this.objects.push(skyDome);

    // Mountains
    const mountains = new Mountains();
    scene.add(mountains.group);
    this.objects.push(mountains);

    // Stars Particles
    const bounds = {
      min: new THREE.Vector3(-300, -300, -300),
      max: new THREE.Vector3(300, 300, 300)
    };
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 200 : 800;

    const stars = new Particles({
      count: starCount,
      color: 0xffffff,
      size: 0.7,
      bounds: bounds,
      drift: new THREE.Vector3(0.01, 0.01, 0.0) // Slow drift
    });
    scene.add(stars.points);
    this.objects.push(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2040, 0.40);
    scene.add(ambientLight);
    this.ambientLight = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xffd4a0, 0.80);
    sunLight.position.set(80, 60, 30);
    scene.add(sunLight);
    this.sunLight = sunLight;

    const moonLight = new THREE.DirectionalLight(0x4060ff, 0.25);
    moonLight.position.set(-50, 20, -30);
    scene.add(moonLight);
    this.moonLight = moonLight;

    const peakLight = new THREE.PointLight(0x4080ff, 0.35, 120);
    peakLight.position.set(0, 45, -20); // approximated tallest peak
    scene.add(peakLight);
    this.peakLight = peakLight;

    return this;
  },

  update(delta) {
    // Only update particles in this scene
    for (const obj of this.objects) {
      if (obj.update) obj.update(delta);
    }
  },

  dispose() {
    for (const obj of this.objects) {
      if (obj.dispose) obj.dispose();
    }
  }
};
