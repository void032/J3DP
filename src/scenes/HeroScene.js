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

  sceneFadeOut(progress) {
    if (!this.group && !this.objects) return;

    // Lerp from 0.88 (1) to 0.92 (0)
    let opacity = 1.0;
    if (progress >= 0.88 && progress <= 0.92) {
      opacity = 1.0 - ((progress - 0.88) / 0.04);
    } else if (progress > 0.92) {
      opacity = 0.0;
    }

    const applyOpacity = (obj) => {
      if (obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => { if(m.transparent !== undefined) { m.transparent = true; m.opacity = opacity; } });
        } else {
           if(obj.material.transparent !== undefined) {
             obj.material.transparent = true;
             obj.material.opacity = opacity;
           }
        }
      }
    };

    if (this.group) {
      this.group.traverse((child) => {
        if (child.isMesh || child.isPoints) applyOpacity(child);
      });
    } else if (this.objects) {
      this.objects.forEach(obj => {
        if (obj.mesh) applyOpacity(obj.mesh);
        else if (obj.points) applyOpacity(obj.points);
      });
    }

    if (progress >= 0.92) {
       if (this.group) this.group.visible = false;
    }
  },

  dispose() {
    for (const obj of this.objects) {
      if (obj.dispose) obj.dispose();
    }
  }
};
