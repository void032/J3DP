import * as THREE from 'three';
import { Particles } from '../objects/Particles.js';
import { clamp01 } from '../utils/MathUtils.js';

export const FooterScene = {
  init(scene, camera) {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.camera = camera;

    this._targetPos = new THREE.Vector3();
    this._offset = new THREE.Vector3(0, 0, -12);

    // 1. SkyStars
    const bounds = {
      min: new THREE.Vector3(-400, -400, -400),
      max: new THREE.Vector3(400, 400, 400)
    };

    const isMobile = window.innerWidth < 768;
    this.stars = new Particles({
      count: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (isMobile ? 300 : 1200),
      color: 0xffffff,
      size: 0.6,
      bounds: bounds,
      drift: new THREE.Vector3(0.005, 0.005, 0)
    });

    // Starts invisible
    this.stars.points.material.opacity = 0;
    this.group.add(this.stars.points);

    // 2. Background Shader Plane
    this.footerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_brightness: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2  u_mouse;
        uniform float u_brightness;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                     mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for(int i=0; i<5; i++){ v += a*noise(p); p*=2.1; a*=0.5; }
          return v;
        }
        void main() {
          vec2 uv = vUv + u_mouse * 0.08;
          uv += vec2(u_time * 0.012, u_time * 0.008);

          float n = fbm(uv * 2.5 + fbm(uv * 1.8 + vec2(u_time * 0.03)));

          vec3 c0 = vec3(0.01, 0.02, 0.04);
          vec3 c1 = vec3(0.04, 0.07, 0.18);
          vec3 c2 = vec3(0.08, 0.03, 0.18);

          vec3 col;
          if(n < 0.5) col = mix(c0, c1, n * 2.0);
          else        col = mix(c1, c2, (n - 0.5) * 2.0);

          col *= u_brightness * 0.8;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
      transparent: true
    });

    // Starts invisible
    this.footerMaterial.opacity = 0;

    const planeGeo = new THREE.PlaneGeometry(50, 28);
    this.shaderPlane = new THREE.Mesh(planeGeo, this.footerMaterial);

    scene.add(this.shaderPlane); // Add to scene to follow camera easily, detached from group
    this.shaderPlane.visible = false;

    this.time = 0;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.timeScale = reduced ? 0 : 1;

    scene.add(this.group);
    return this;
  },

  update(delta, progress) {
    const isVisible = progress >= 0.88;

    if (isVisible) {
      this.group.visible = true;
      this.shaderPlane.visible = true;

      this.time += delta * this.timeScale;

      if (this.stars.update) this.stars.update(delta);

      this.footerMaterial.uniforms.u_time.value = this.time;

      // Lock plane to camera at fixed z-offset
      this._targetPos.copy(this.camera.position);
      this._offset.set(0, 0, -12).applyQuaternion(this.camera.quaternion);
      this.shaderPlane.position.copy(this._targetPos.add(this._offset));
      this.shaderPlane.quaternion.copy(this.camera.quaternion);

      // Fade in stars (0.90 -> 0.95)
      let starAlpha = 0;
      if (progress >= 0.90) {
        starAlpha = clamp01((progress - 0.90) / 0.05);
      }
      this.stars.points.material.opacity = starAlpha;

      // Fade in background shader plane (0.88 -> 0.92)
      let bgAlpha = 0;
      if (progress >= 0.88) {
        bgAlpha = clamp01((progress - 0.88) / 0.04);
      }
      this.footerMaterial.uniforms.u_brightness.value = bgAlpha;

    } else {
      this.group.visible = false;
      this.shaderPlane.visible = false;
    }
  },

  dispose() {
    if (this.stars && this.stars.dispose) this.stars.dispose();
    if (this.shaderPlane) {
      this.shaderPlane.geometry.dispose();
      this.shaderPlane.material.dispose();
    }
  }
};
