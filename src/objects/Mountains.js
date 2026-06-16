import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader.js';

// Simple FBM noise function for heightmap
function hash(p) {
  let h = Math.sin(p[0] * 12.9898 + p[1] * 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

function noise(x, y) {
  const i = [Math.floor(x), Math.floor(y)];
  const f = [x - i[0], y - i[1]];
  const u = [f[0] * f[0] * (3.0 - 2.0 * f[0]), f[1] * f[1] * (3.0 - 2.0 * f[1])];
  return (
    hash(i) * (1.0 - u[0]) * (1.0 - u[1]) +
    hash([i[0] + 1.0, i[1]]) * u[0] * (1.0 - u[1]) +
    hash([i[0], i[1] + 1.0]) * (1.0 - u[0]) * u[1] +
    hash([i[0] + 1.0, i[1] + 1.0]) * u[0] * u[1]
  );
}

function fbm(x, y) {
  let v = 0.0;
  let a = 0.5;
  const shift = [100.0, 100.0];
  let p = [x, y];
  for (let i = 0; i < 5; i++) {
    v += a * noise(p[0], p[1]);
    p = [p[0] * 2.0 + shift[0], p[1] * 2.0 + shift[1]];
    a *= 0.5;
  }
  return v;
}

export class Mountains {
  constructor() {
    this.group = new THREE.Group();

    // Check for GLB model first
    const gltf = AssetLoader.getModel('mountains');

    if (gltf) {
      const model = gltf.scene;

      // Auto-center to bounding box
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      this.group.add(model);
    } else {
      // Fallback: procedural heightmap
      const geometry = new THREE.PlaneGeometry(200, 80, 256, 128);
      geometry.rotateX(-Math.PI / 2);

      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const y = Math.abs(fbm(x * 0.05, z * 0.05)) * 45;
        positions.setY(i, y);
      }

      geometry.computeVertexNormals();

      const diffuseMap = AssetLoader.getTexture('mountain_rock');
      const normalMap = AssetLoader.getTexture('mountain_rock_n');

      if (diffuseMap) {
        diffuseMap.wrapS = THREE.RepeatWrapping;
        diffuseMap.wrapT = THREE.RepeatWrapping;
        diffuseMap.repeat.set(4, 4);
      }

      if (normalMap) {
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(4, 4);
      }

      const material = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        roughness: 0.9,
        metalness: 0.0
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.group.add(mesh);
    }

    // Silhouette wings
    const silhouetteTex = AssetLoader.getTexture('mountain_silhouette');
    const silhouetteMat = new THREE.MeshBasicMaterial({
      map: silhouetteTex,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0x060810
    });

    const wingGeom1 = new THREE.PlaneGeometry(80, 60);
    const wing1 = new THREE.Mesh(wingGeom1, silhouetteMat);
    wing1.position.set(-120, 0, 0);

    const wingGeom2 = new THREE.PlaneGeometry(80, 60);
    const wing2 = new THREE.Mesh(wingGeom2, silhouetteMat);
    wing2.position.set(120, 0, 0);

    this.group.add(wing1, wing2);
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this._disposeMaterial(mat));
          } else {
            this._disposeMaterial(child.material);
          }
        }
      }
    });
  }

  _disposeMaterial(mat) {
    if (mat.map) mat.map.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
    mat.dispose();
  }
}
