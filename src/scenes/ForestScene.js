import * as THREE from 'three';
import { Forest } from '../objects/Forest.js';

export const ForestScene = {
  init(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Forest Object
    this.forest = new Forest();
    this.group.add(this.forest.group);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1a3020, 0.50);
    this.group.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.60);
    sunLight.position.set(0, 100, 0);
    this.group.add(sunLight);

    scene.add(this.group);
    return this;
  },

  update(delta, progress, camera) {
    // Forest object remains visible for DescentScene as well, so we don't hide it
    // here if progress > 0.75, but we do trigger its internal update logic
    if (progress >= 0.55 && progress <= 0.88) { // Visible through DescentScene
      this.group.visible = true;
      if (this.forest.update) {
        this.forest.update(delta, progress, camera);
      }
    } else {
      this.group.visible = false;
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
    if (this.forest && this.forest.dispose) {
      this.forest.dispose();
    }
    // Lighting is cleaned up on full scene destroy
  }
};
