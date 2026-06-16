import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader.js';

export class SkyDome {
  constructor() {
    const geometry = new THREE.SphereGeometry(800, 32, 16);
    // Invert the sphere so we can see it from the inside
    geometry.scale(1, -1, 1);

    const texture = AssetLoader.getTexture('sky_night');
    const material = new THREE.MeshBasicMaterial({ map: texture });

    this.mesh = new THREE.Mesh(geometry, material);
  }

  dispose() {
    this.mesh.geometry.dispose();
    if (this.mesh.material.map) this.mesh.material.map.dispose();
    this.mesh.material.dispose();
  }
}
