import * as THREE from 'three';

export class Particles {
  constructor({ count, color, size, bounds, drift }) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count); // Used for oscillation

    for (let i = 0; i < count; i++) {
      // Random position within bounds object (min and max Vector3)
      positions[i * 3 + 0] = bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x);
      positions[i * 3 + 1] = bounds.min.y + Math.random() * (bounds.max.y - bounds.min.y);
      positions[i * 3 + 2] = bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z);

      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });

    this.points = new THREE.Points(geometry, material);

    // Store configuration for update loop
    this.drift = drift;
    this.bounds = bounds;
    this.count = count;
  }

  update(delta) {
    const positions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;

      // Apply drift
      positions[idx + 0] += this.drift.x * delta;
      positions[idx + 1] += this.drift.y * delta;
      positions[idx + 2] += this.drift.z * delta;

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
