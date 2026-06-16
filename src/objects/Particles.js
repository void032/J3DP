import * as THREE from 'three';

export class Particles {
  constructor({ count, color, size, bounds, drift, pulse = false }) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count); // Used for oscillation

    // Custom shader needed for per-particle opacity oscillation
    // unless we iterate colors/opacities. Using standard attributes for color oscillation.
    // However, the spec allows updating material opacity or modifying vertices.
    // For per-particle opacity, we'll store phases.

    for (let i = 0; i < count; i++) {
      // Random position within bounds object (min and max Vector3)
      positions[i * 3 + 0] = bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x);
      positions[i * 3 + 1] = bounds.min.y + Math.random() * (bounds.max.y - bounds.min.y);
      positions[i * 3 + 2] = bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z);

      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    let material;
    if (pulse) {
      // For per-particle pulsing, we need a custom shader material
      material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uSize: { value: size * window.devicePixelRatio }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSize;
          attribute float aPhase;
          varying float vOpacity;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vOpacity = sin(uTime + aPhase) * 0.3 + 0.7;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vOpacity;
          void main() {
            // Simple circular particle
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            gl_FragColor = vec4(uColor, vOpacity);
          }
        `,
        transparent: true,
        depthWrite: false
      });
    } else {
      material = new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
      });
    }

    this.points = new THREE.Points(geometry, material);

    // Store configuration for update loop
    this.drift = drift;
    this.bounds = bounds;
    this.count = count;
    this.pulse = pulse;
    this.time = 0;
  }

  update(delta) {
    this.time += delta;

    if (this.pulse && this.points.material.uniforms) {
      this.points.material.uniforms.uTime.value = this.time;
    }

    const positions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;

      // Apply drift
      positions[idx + 0] += this.drift.x * delta;
      positions[idx + 1] += this.drift.y * delta;
      positions[idx + 2] += this.drift.z * delta;

      // Add slow random XZ drift for fireflies if pulsing
      if (this.pulse) {
         positions[idx + 0] += (Math.sin(this.time + i) * 0.5) * delta;
         positions[idx + 2] += (Math.cos(this.time + i) * 0.5) * delta;
      }

      // Wrap bounds - No new Vector3 allocations here!
      if (positions[idx + 0] > this.bounds.max.x) positions[idx + 0] = this.bounds.min.x;
      if (positions[idx + 0] < this.bounds.min.x) positions[idx + 0] = this.bounds.max.x;

      if (positions[idx + 1] > this.bounds.max.y) positions[idx + 1] = this.bounds.min.y;
      if (positions[idx + 1] < this.bounds.min.y) positions[idx + 1] = this.bounds.max.y;

      if (positions[idx + 2] > this.bounds.max.z) positions[idx + 2] = this.bounds.min.z;
      if (positions[idx + 2] < this.bounds.min.z) positions[idx + 2] = this.bounds.max.z;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    if (this.points.geometry) this.points.geometry.dispose();
    if (this.points.material) this.points.material.dispose();
  }
}
