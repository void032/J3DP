import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader.js';

export class Forest {
  constructor() {
    this.group = new THREE.Group();

    // Check for reduced motion / mobile
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    this.useInstancing = !reduced && !isMobile;

    // 1. Far layer (ground texture plane)
    const farGeo = new THREE.PlaneGeometry(600, 600);
    farGeo.rotateX(-Math.PI / 2);

    const canopyTex = AssetLoader.getTexture('forest_canopy');
    if (canopyTex) {
      canopyTex.wrapS = THREE.RepeatWrapping;
      canopyTex.wrapT = THREE.RepeatWrapping;
      canopyTex.repeat.set(1, 1);
    }

    const farMat = new THREE.MeshBasicMaterial({ map: canopyTex });
    this.farPlane = new THREE.Mesh(farGeo, farMat);
    this.farPlane.position.y = -8;
    this.group.add(this.farPlane);

    // 2. Near layer (Instanced Cones)
    if (this.useInstancing) {
      const instanceCount = 500;
      // Using a simple cone to represent a tree for scaffolding per spec
      const coneGeo = new THREE.ConeGeometry(2, 6, 8);
      // Shift geometry up so origin is at bottom center
      coneGeo.translate(0, 3, 0);

      const coneMat = new THREE.MeshBasicMaterial({ color: 0x0a1a08 });
      this.instancedTrees = new THREE.InstancedMesh(coneGeo, coneMat, instanceCount);
      this.instancedTrees.frustumCulled = true;

      const dummy = new THREE.Object3D();
      for (let i = 0; i < instanceCount; i++) {
        // Scattered randomly: x ±150, z -30→-180, y=0
        const x = (Math.random() - 0.5) * 300;
        const z = -30 - (Math.random() * 150);

        // Scale: random 0.8–2.5, random Y rotation
        const scale = 0.8 + Math.random() * 1.7;
        const rotY = Math.random() * Math.PI * 2;

        dummy.position.set(x, 0, z);
        dummy.rotation.y = rotY;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        this.instancedTrees.setMatrixAt(i, dummy.matrix);
      }
      this.group.add(this.instancedTrees);
    }

    // 3. Exit-cloud wisps
    this.wisps = [];
    const wispGeo = new THREE.PlaneGeometry(120, 40);
    const wispMat = new THREE.MeshBasicMaterial({
      color: 0xaabbcc,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(wispGeo, wispMat.clone());
      // Positions around y=22-28
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        22 + Math.random() * 6,
        -10 - (Math.random() * 40)
      );
      this.wisps.push(mesh);
      this.group.add(mesh);
    }
  }

  update(delta, progress, camera) {
    // Hide instanced trees if camera is too high
    if (this.useInstancing && this.instancedTrees) {
      this.instancedTrees.visible = camera.position.y < 75;
    }

    // Wisps logic
    const showWisps = progress >= 0.55 && progress <= 0.65;
    for (const wisp of this.wisps) {
      wisp.visible = showWisps;
      if (showWisps) {
        wisp.lookAt(camera.position);

        // Fade out as camera rises or progress nears 0.65
        const fade = 1.0 - ((progress - 0.55) / 0.1);
        wisp.material.opacity = 0.25 * Math.max(0, fade);
      }
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (!mat.map) mat.dispose(); // dont dispose shared maps
            });
          } else {
            if (!child.material.map) child.material.dispose();
          }
        }
      }
    });
  }
}
