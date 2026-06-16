import { createSceneManager } from './core/SceneManager.js';
import { createCameraRig }    from './core/CameraRig.js';
import { createScrollEngine } from './core/ScrollEngine.js';
import { createTextLayer }    from './text/TextLayer.js';
import { AssetLoader }        from './core/AssetLoader.js';

import { HeroScene }       from './scenes/HeroScene.js';
import { MountainPass }    from './scenes/MountainPass.js';
import { CloudScene }      from './scenes/CloudScene.js';

async function init() {
  // Mobile overrides logic
  const isMobile = window.innerWidth < 768;
  const scrollDriver = document.getElementById('scroll-driver');
  if (isMobile && scrollDriver) {
    scrollDriver.style.height = '500vh';
  }

  // 1. Boot core
  const sm     = createSceneManager(document.getElementById('canvas-container'));
  const rig    = createCameraRig(sm.camera);
  const text   = createTextLayer(document.getElementById('text-layer'));

  // 2. Load required assets (blocks until complete, updates loader bar)
  await AssetLoader.loadCritical();

  // 3. Init scenes
  const hero     = HeroScene.init(sm.scene, sm.renderer);
  const pass     = MountainPass.init(sm.scene);
  const cloud    = CloudScene.init(sm.scene, sm.camera);

  // 4. Register RAF updates
  sm.register((delta) => rig.update(delta));
  sm.register((delta) => hero.update(delta));
  sm.register((delta, progress) => pass.update(delta, progress));
  sm.register((delta, progress) => cloud.update(delta, progress));
  AssetLoader.loadSecondary();
  AssetLoader.loadLazy();

  // 5. Wire scroll engine
  createScrollEngine({ cameraRig: rig, textLayer: text, sceneManager: sm });

  // 6. Start RAF loop
  sm.startLoop();

  // 7. Hide loader
  AssetLoader.hideLoader();
}

init();
