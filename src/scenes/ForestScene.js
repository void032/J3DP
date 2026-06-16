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

  dispose() {
    if (this.forest && this.forest.dispose) {
      this.forest.dispose();
    }
    // Lighting is cleaned up on full scene destroy
  }
};
