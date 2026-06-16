import * as THREE from 'three';
import { Particles } from '../objects/Particles.js';

export const DescentScene = {
  init(scene, camera) {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.camera = camera;

    // Forest is inherited from ForestScene, so we don't recreate it here.

    // Firefly Particles
    const isMobile = window.innerWidth < 768;
    const fireflyCount = isMobile ? 80 : 280;

    const bounds = {
      min: new THREE.Vector3(-60, 0, -200), // Cover the descent area roughly
      max: new THREE.Vector3(60, 30, -50)
    };

    this.fireflies = new Particles({
      count: fireflyCount,
      color: 0xaaffaa,
      size: 0.4,
      bounds: bounds,
      drift: new THREE.Vector3(0, 0.02, 0), // Base upward drift, random added in Particles update
      pulse: true
    });
    this.group.add(this.fireflies.points);

    // Torchlight attached near camera
    this.torchLight = new THREE.PointLight(0xffaa44, 2.5, 35);
    scene.add(this.torchLight); // Add directly to scene to follow camera easily

    // Vignette DOM element
    this.vignetteEl = document.getElementById('vignette');

    scene.add(this.group);
    return this;
  },

  update(delta, progress) {
    const isVisible = progress >= 0.75 && progress <= 0.88;

    if (isVisible) {
      this.group.visible = true;
      this.torchLight.visible = true;

      if (this.fireflies && this.fireflies.update) {
        this.fireflies.update(delta);
      }

      // Update torchlight position relative to camera
      this.torchLight.position.copy(this.camera.position);
      this.torchLight.position.y -= 5;

    } else {
      this.group.visible = false;
      this.torchLight.visible = false;
    }

    // Vignette fade logic (t=0.85 to t=0.90)
    if (this.vignetteEl) {
      if (progress >= 0.85 && progress <= 0.90) {
        const alpha = (progress - 0.85) / 0.05;
        this.vignetteEl.style.opacity = Math.max(0, Math.min(1, alpha));
      } else if (progress > 0.90) {
        this.vignetteEl.style.opacity = 1;
      } else {
        this.vignetteEl.style.opacity = 0;
      }
    }
  },

  dispose() {
    if (this.fireflies && this.fireflies.dispose) {
      this.fireflies.dispose();
    }
  }
};
