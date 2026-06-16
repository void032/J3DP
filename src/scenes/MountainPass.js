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
    const dustCount = isMobile ? 60 : 240;

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
