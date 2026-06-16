import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader.js';
import { VideoManager } from '../video/VideoManager.js';

const USE_VIDEO_FALLBACK = false; // flip to true to swap 3D objects for video plane

export const CloudScene = {
  init(scene, camera) {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.camera = camera;
    this.clouds = [];
    this.materialBase = null;
    this._targetPos = new THREE.Vector3();
    this._offset = new THREE.Vector3(0, 0, -8);
    this.isUsingVideo = USE_VIDEO_FALLBACK;

    // Check reduced motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) this.isUsingVideo = false;

    if (this.isUsingVideo) {
      // Video fallback
      const videoUrl = '/video/cloud_flight.mp4';
      const texture = VideoManager.register('cloud_flight', videoUrl);

      const geometry = new THREE.PlaneGeometry(80, 45); // Scale to fit frustum roughly
      const material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });

      this.videoPlane = new THREE.Mesh(geometry, material);

      // We will place this plane relative to the camera in the update loop
      scene.add(this.videoPlane);

    } else {
      // 3D Billboards
      const isMobile = window.innerWidth < 768;
      const count = reduced ? 0 : (isMobile ? 6 : 18);

      const texture = AssetLoader.getTexture('cloud_sprite');
      this.materialBase = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: 0
      });

      const geometry = new THREE.PlaneGeometry(55, 35);

      for (let i = 0; i < count; i++) {
        // Clone material so we can have unique opacities per cloud
        const mat = this.materialBase.clone();
        mat.opacity = 0.6 + (Math.random() * 0.25); // 0.6 - 0.85

        const mesh = new THREE.Mesh(geometry, mat);

        // Random position in a volume: x ±80, y 10→35, z -15→-55
        mesh.position.set(
          (Math.random() - 0.5) * 160,
          10 + Math.random() * 25,
          -15 - (Math.random() * 40)
        );

        const drift = new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.001,
          0
        );

        this.clouds.push({ mesh, drift });
        this.group.add(mesh);
      }

      scene.add(this.group);
    }

    return this;
  },

  update(delta, progress) {
    const isVisible = progress >= 0.35 && progress <= 0.58;

    if (this.isUsingVideo) {
      this.videoPlane.visible = isVisible;
      if (isVisible) {
        VideoManager.seekTo('cloud_flight', progress, 0.38, 0.55);

        // Lock plane to camera at fixed z-offset
        this._targetPos.copy(this.camera.position);
        this._offset.set(0, 0, -8).applyQuaternion(this.camera.quaternion);
        this.videoPlane.position.copy(this._targetPos.add(this._offset));
        this.videoPlane.quaternion.copy(this.camera.quaternion);
      }
    } else {
      this.group.visible = isVisible;
      if (isVisible) {
        for (const cloud of this.clouds) {
          // Apply drift
          cloud.mesh.position.addScaledVector(cloud.drift, delta);
          // Look at camera
          cloud.mesh.lookAt(this.camera.position);
        }
      }
    }
  },

  dispose() {
    if (this.isUsingVideo) {
      if (this.videoPlane) {
        this.videoPlane.geometry.dispose();
        this.videoPlane.material.dispose();
        VideoManager.dispose('cloud_flight');
      }
    } else {
      if (this.materialBase) this.materialBase.dispose();
      this.group.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      });
    }
  }
};
