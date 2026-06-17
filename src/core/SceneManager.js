import * as THREE from 'three';

export function createSceneManager(containerEl) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); // Never exceed 1.5
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false; // No real-time shadows — use baked lighting
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  containerEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x03050a, 0.004);

  const clock = new THREE.Clock();

  // Update registry: each system registers an update(delta, progress) function
  const updaters = [];
  function register(fn) { updaters.push(fn); }

  let currentProgress = 0;
  function setProgress(p) {
    currentProgress = p;
  }

  let rafId;
  function startLoop() {
    function loop() {
      rafId = requestAnimationFrame(loop);
      const delta = clock.getDelta();
      for (const fn of updaters) fn(delta, currentProgress);
      renderer.render(scene, camera);
    }
    loop();
  }

  // Camera lives on SceneManager so all systems share the same reference
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function destroy() {
    cancelAnimationFrame(rafId);
    renderer.dispose();
  }

  return { renderer, scene, camera, clock, register, setProgress, startLoop, destroy };
}
