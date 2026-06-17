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
