import { createSceneManager } from './core/SceneManager.js';
import { createCameraRig }    from './core/CameraRig.js';
import { createScrollEngine } from './core/ScrollEngine.js';

// We only import what is required to be scaffolded in the spec
// import { createTextLayer }    from './text/TextLayer.js'
// import { AssetLoader }        from './core/AssetLoader.js'

// import { HeroScene }       from './scenes/HeroScene.js'
// import { MountainPass }    from './scenes/MountainPass.js'
// import { CloudScene }      from './scenes/CloudScene.js'
// import { ForestScene }     from './scenes/ForestScene.js'
// import { DescentScene }    from './scenes/DescentScene.js'
// import { FooterScene }     from './scenes/FooterScene.js'
// import { MouseParallax }   from './utils/MouseParallax.js'

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
  // const text   = createTextLayer(document.getElementById('text-layer'))
  // const mouse  = MouseParallax.create(rig)

  // 2. Load required assets (blocks until complete, updates loader bar)
  // await AssetLoader.loadCritical()

  // 3. Init scenes (each adds objects to sm.scene)
  // const hero     = HeroScene.init(sm.scene, sm.renderer)
  // const pass     = MountainPass.init(sm.scene)
  // const cloud    = CloudScene.init(sm.scene, sm.camera)
  // const forest   = ForestScene.init(sm.scene)
  // const descent  = DescentScene.init(sm.scene, sm.camera)
  // const footer   = FooterScene.init(sm.scene, sm.camera)

  // 4. Register RAF updates
  sm.register((delta) => rig.update(delta));
  // sm.register((delta) => hero.update(delta))
  // sm.register((delta) => cloud.update(delta, sm.scene.fog))
  // sm.register((delta) => footer.update(delta, sm.camera))
  // sm.register((delta) => AssetLoader.loadSecondary(delta)) // lazy-load remaining assets

  // 5. Wire scroll engine (drives camera + text + fog from scroll progress)
  createScrollEngine({ cameraRig: rig, sceneManager: sm }); // textLayer, fogController omitted for scaffold

  // 6. Start RAF loop
  sm.startLoop();

  // 7. Hide loader
  // AssetLoader.hideLoader()

  // Minimal logic to hide loader for now since AssetLoader is missing
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      const textLayer = document.getElementById('text-layer');
      if (textLayer) textLayer.style.pointerEvents = 'auto';
    }, 600);
  }
}

init();
