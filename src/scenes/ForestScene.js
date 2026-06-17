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
    if (this.forest && this.forest.dispose) {
      this.forest.dispose();
    }
    // Lighting is cleaned up on full scene destroy
  }
};
