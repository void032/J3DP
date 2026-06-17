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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fireflyCount = reduced ? 0 : (isMobile ? 80 : 280);

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

  sceneFadeOut(progress) {
    if (!this.group && !this.objects) return;

    // Lerp from 0.88 (1) to 0.92 (0)
    let opacity = 1.0;
    if (progress >= 0.88 && progress <= 0.92) {
      opacity = 1.0 - ((progress - 0.88) / 0.04);
    } else if (progress > 0.92) {
      opacity = 0.0;
    }


    // Optimized fade out
    if (!this._fadeChildren) {
       this._fadeChildren = [];
       const traverse = (obj) => {
         if (obj.isMesh || obj.isPoints) this._fadeChildren.push(obj);
         if (obj.children) obj.children.forEach(traverse);
       };
       if (this.group) traverse(this.group);
       if (this.objects) {
         this.objects.forEach(o => {
           if (o.mesh) traverse(o.mesh);
           if (o.points) traverse(o.points);
         });
       }
    }

    for (let i=0; i<this._fadeChildren.length; i++) {
       const obj = this._fadeChildren[i];
       if (obj.material) {
         const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
         for (let m=0; m<mats.length; m++) {
           const mat = mats[m];
           if (mat.transparent !== undefined) {
              if (!mat.transparent) {
                 mat.transparent = true;
                 mat.needsUpdate = true;
              }
              mat.opacity = opacity;
           }
         }
       }
    }

    if (progress >= 0.92) {
       if (this.group) this.group.visible = false;
    }
  },

  dispose() {
    if (this.fireflies && this.fireflies.dispose) {
      this.fireflies.dispose();
    }
  }
};
