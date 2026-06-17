import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader.js';
import { Particles } from '../objects/Particles.js';

export const MountainPass = {
  init(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.objects = [];

    const diffuseMap = AssetLoader.getTexture('mountain_rock');
    const normalMap = AssetLoader.getTexture('mountain_rock_n');

    if (diffuseMap) {
      diffuseMap.wrapS = THREE.RepeatWrapping;
      diffuseMap.wrapT = THREE.RepeatWrapping;
      diffuseMap.repeat.set(2, 4);
    }

    if (normalMap) {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(2, 4);
    }

    const material = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      normalMap: normalMap,
      roughness: 0.9,
      metalness: 0.0
    });

    // Left Wall
    const leftGeometry = new THREE.PlaneGeometry(40, 80, 4, 16);
    this._applyNoise(leftGeometry);
    const leftWall = new THREE.Mesh(leftGeometry, material);
    leftWall.position.set(-18, 20, 8);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    // Right Wall (mirrored)
    const rightGeometry = new THREE.PlaneGeometry(40, 80, 4, 16);
    this._applyNoise(rightGeometry);
    const rightWall = new THREE.Mesh(rightGeometry, material);
    rightWall.position.set(18, 20, 8);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);

    // Moonlight Shaft
    const moonShaft = new THREE.PointLight(0x6080c0, 0.60, 80);
    moonShaft.position.set(0, 45, 5);
    this.group.add(moonShaft);

    // Dust Motes
    const isMobile = window.innerWidth < 768;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dustCount = reduced ? 0 : (isMobile ? 60 : 240);

    const bounds = {
      min: new THREE.Vector3(-15, -20, -20),
      max: new THREE.Vector3(15, 20, 30)
    };

    const dustMotes = new Particles({
      count: dustCount,
      color: 0xaaaaaa,
      size: 0.3,
      bounds: bounds,
      drift: new THREE.Vector3(0, 0, 0.008) // Drift +Z
    });

    this.group.add(dustMotes.points);
    this.objects.push(dustMotes);

    scene.add(this.group);
    return this;
  },

  _applyNoise(geometry) {
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const zOffset = (Math.random() * 4) - 2; // ±2 units
      positions.setZ(i, positions.getZ(i) + zOffset);
    }
    geometry.computeVertexNormals();
  },

  update(delta, progress) {
    if (progress >= 0.18) {
      this.group.visible = true;
      for (const obj of this.objects) {
        if (obj.update) obj.update(delta);
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
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose()); // Textures are owned by AssetLoader
          } else {
            child.material.dispose();
          }
        }
      }
    });

    for (const obj of this.objects) {
      if (obj.dispose) obj.dispose();
    }
  }
};
