import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Loader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.assets = {
      textures: {},
      models: {},
      videos: {}
    };

    this.totalToLoad = 0;
    this.loadedCount = 0;
    this.loaderBar = document.getElementById('loader-bar');
    this.loaderEl = document.getElementById('loader');
  }

  _incrementLoaded() {
    this.loadedCount++;
    if (this.loaderBar && this.totalToLoad > 0) {
      const progress = (this.loadedCount / this.totalToLoad) * 100;
      this.loaderBar.style.width = `${progress}%`;
    }
  }

  async loadTexture(id, url) {
    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.assets.textures[id] = texture;
          this._incrementLoaded();
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture ${url}`, error);
          this._incrementLoaded(); // graceful fallback
          resolve(null);
        }
      );
    });
  }

  async loadModel(id, url) {
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.assets.models[id] = gltf;
          this._incrementLoaded();
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.warn(`Optional model ${url} failed to load, falling back.`, error);
          this._incrementLoaded();
          resolve(null); // Silent fallback
        }
      );
    });
  }

  async loadCritical() {
    // Phase 1 (required): sky texture, mountain texture
    const criticalAssets = [
      { type: 'texture', id: 'sky_night', url: '/textures/sky_night.jpg' },
      { type: 'texture', id: 'mountain_rock', url: '/textures/mountain_rock.jpg' },
      { type: 'texture', id: 'mountain_rock_n', url: '/textures/mountain_rock_n.jpg' },
      { type: 'texture', id: 'mountain_silhouette', url: '/textures/mountain_silhouette.png' }
    ];

    this.totalToLoad += criticalAssets.length;

    const promises = criticalAssets.map(asset => this.loadTexture(asset.id, asset.url));
    await Promise.all(promises);
  }

  loadSecondary() {
    // Phase 2: Show progress bar but don't block start.
    const secondaryAssets = [
      { type: 'texture', id: 'cloud_sprite', url: '/textures/cloud_sprite.png' },
      { type: 'texture', id: 'forest_canopy', url: '/textures/forest_canopy.jpg' }
    ];

    this.totalToLoad += secondaryAssets.length;
    secondaryAssets.forEach(asset => this.loadTexture(asset.id, asset.url));
  }

  loadLazy() {
    // Phase 3: Lazy load models / video in background
    this.loadModel('mountains', '/models/mountains.glb');
  }

  hideLoader() {
    if (this.loaderEl) {
      this.loaderEl.style.opacity = '0';
      setTimeout(() => {
        this.loaderEl.style.display = 'none';
        const textLayer = document.getElementById('text-layer');
        if (textLayer) {

        }
      }, 600);
    }
  }

  getTexture(id) {
    return this.assets.textures[id];
  }

  getModel(id) {
    return this.assets.models[id];
  }
}

export const AssetLoader = new Loader();
