# AGENT PROMPT — Cinematic Camera-Flight Website

## VISION

Build a **single-page cinematic 3D experience** where scrolling moves a Three.js
camera along a predefined spline path through a world — not the DOM. The visitor
never sees a "page" scroll. Instead, they fly: through a mountain pass, into clouds,
above a forest canopy, descending to a footer that collapses everything into a logo.

This is not a scroll-animation site. It is a VR camera flight triggered by scroll
input. The DOM is pinned at 100vh. Only the Three.js camera moves.

The world is a deliberate mixture of **3D geometry + PNG image planes + HTML5 video
textures** — each scene uses whichever combination hits the visual target within the
performance budget. Text overlays are HTML elements positioned fixed over the canvas,
animated by Anime.js, timed to scroll progress.

---

## TECH STACK

- **Vite** (vanilla JS — no React, no Vue, no Svelte)
- **Three.js r160** via npm — import from `three`
- **GSAP 3.12** + **ScrollTrigger plugin** — scroll progress → camera path
- **Anime.js 3.2** — text and UI element animations
- **No React** — pure ES modules
- **No Three.js post-processing** (EffectComposer) — atmosphere via fog + CSS only
- **No OrbitControls** — camera is 100% path-driven, never user-controlled
- **No physics** — cinematic experience only
- **Fonts:** `Syne` (display headings) + `Space Mono` (labels/mono) + `Inter` (body) via Google Fonts link in HTML

---

## FOLDER STRUCTURE

```
src/
  main.js                    # Entry: instantiate all systems, start RAF

  core/
    SceneManager.js          # Renderer, scene, clock, RAF loop, resize
    CameraRig.js             # Camera + CatmullRomCurve3 + scroll-driven update
    ScrollEngine.js          # GSAP ScrollTrigger setup — dispatches progress to all systems
    AssetLoader.js           # Preload textures + GLBs + videos; progress bar interface

  scenes/
    HeroScene.js             # t=0.00–0.20: Mountains, sky, entry text
    MountainPass.js          # t=0.20–0.38: Flying between peaks, FOV compress
    CloudScene.js            # t=0.38–0.55: Cloud bank entry and exit
    ForestScene.js           # t=0.55–0.75: Drone view, canopy, feature text beats
    DescentScene.js          # t=0.75–0.88: Descending, fireflies, glitch text
    FooterScene.js           # t=0.88–1.00: Logo, contacts, fluid shader, mouse parallax

  objects/
    Mountains.js             # Heightmap PlaneGeometry + rock texture (or GLB fallback)
    SkyDome.js               # Inverted sphere r=800, sky texture
    Clouds.js                # Billboard PNG sprite system (fallback: VideoTexture plane)
    Forest.js                # Instanced cone-trees (near) + texture plane (far)
    Particles.js             # Reusable particle system: dust motes, fireflies, stars
    LogoMesh.js              # Footer: SVG overlay with path draw-on OR extruded mesh

  text/
    TextLayer.js             # HTML overlay manager — mounts, shows, hides text beats
    animations/
      cinematic.js           # Fade-up + letter-spacing expand (movie title)
      dust.js                # Canvas2D particles converge/scatter into text
      typewriter.js          # Character-by-character with cursor blink
      glitch.js              # CSS RGB-split jitter 3×, then settles
      reveal.js              # clip-path wipe left→right
      float.js               # Gentle translateY + opacity (Ghibli ease)

  video/
    VideoManager.js          # <video> element lifecycle + THREE.VideoTexture + seek-to-progress

  utils/
    MouseParallax.js         # Normalized mouse position → camera offset (footer only)
    MathUtils.js             # remap(v,a1,b1,a2,b2), clamp01, easeInOutCubic, lerpColor

  styles/
    globals.css              # CSS tokens, font imports, body reset, scrollbar hide
    text.css                 # Text overlay positioning, typography scale, animations
    loader.css               # Loading screen

index.html                   # Minimal shell: canvas container, text layer, scroll driver
vite.config.js               # Vite config: no special plugins needed
package.json
```

---

## HTML SHELL (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PROJECT NAME</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500&display=swap">
  <link rel="stylesheet" href="/src/styles/globals.css">
  <link rel="stylesheet" href="/src/styles/text.css">
  <link rel="stylesheet" href="/src/styles/loader.css">
</head>
<body>
  <!-- Loading screen -->
  <div id="loader">
    <div id="loader-bar-track">
      <div id="loader-bar"></div>
    </div>
    <span id="loader-label">Loading world…</span>
  </div>

  <!-- Three.js mounts here — fixed, fills viewport -->
  <div id="canvas-container"></div>

  <!-- HTML text overlays — fixed, above canvas, pointer-events: none except <a> -->
  <div id="text-layer" aria-live="polite"></div>

  <!-- Scroll height driver — creates scrollable height; DOM never moves -->
  <!-- 600vh = pacing. Adjust this single value to make flight faster/slower. -->
  <div id="scroll-driver" style="height: 600vh; position: relative; z-index: 1;"></div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Layout rules (in `globals.css`)
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  overflow-x: hidden;
  background: var(--bg);
  /* Scrollbar hide: */
  scrollbar-width: none;
}
::-webkit-scrollbar { display: none; }

#canvas-container {
  position: fixed;
  inset: 0;
  z-index: 0;
}

#text-layer {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;   /* Allow scroll to reach scroll-driver behind it */
}

/* Links inside text-layer ARE interactive */
#text-layer a { pointer-events: auto; }
```

---

## DESIGN SYSTEM

### CSS tokens (`globals.css`)
```css
:root {
  /* Core palette */
  --bg:            #03050a;
  --bg-mid:        #060d18;
  --fog-night:     #03050a;
  --fog-cloud:     #8fa8cc;
  --fog-forest:    #0a1a0f;

  /* Text */
  --text-primary:  #f0ede6;
  --text-dim:      rgba(240, 237, 230, 0.50);
  --text-accent:   #7eb8f7;   /* sky blue  — hero/mountain scenes */
  --text-gold:     #f0c060;   /* warm gold — descent/forest scenes */
  --text-cloud:    #c8d8ef;   /* fog white — cloud scene text */

  /* Overlay */
  --vignette: rgba(3, 5, 10, 0.72);

  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-mono:    'Space Mono', monospace;
  --font-body:    'Inter', sans-serif;

  /* Fluid type scale */
  --text-hero:    clamp(52px, 9vw, 128px);
  --text-section: clamp(32px, 5vw, 76px);
  --text-sub:     clamp(15px, 2vw, 24px);
  --text-body:    clamp(13px, 1.4vw, 18px);
  --text-label:   clamp(10px, 1vw, 13px);

  /* Easing */
  --ease-cinema: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-drift:  cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## CORE SYSTEM: `SceneManager.js`

Owns: renderer, scene, clock, RAF loop, resize.

```js
import * as THREE from 'three'

export function createSceneManager(containerEl) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))  // Never exceed 1.5
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = false      // No real-time shadows — use baked lighting
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  containerEl.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x03050a)
  scene.fog = new THREE.FogExp2(0x03050a, 0.004)

  const clock = new THREE.Clock()

  // Update registry: each system registers an update(delta, progress) function
  const updaters = []
  function register(fn) { updaters.push(fn) }

  let rafId
  function startLoop() {
    function loop() {
      rafId = requestAnimationFrame(loop)
      const delta = clock.getDelta()
      for (const fn of updaters) fn(delta)
      renderer.render(scene, camera)
    }
    loop()
  }

  // Camera lives on SceneManager so all systems share the same reference
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  function destroy() {
    cancelAnimationFrame(rafId)
    renderer.dispose()
  }

  return { renderer, scene, camera, clock, register, startLoop, destroy }
}
```

---

## CORE SYSTEM: `CameraRig.js`

The heart of the experience. Two `CatmullRomCurve3` paths — one for position, one
for lookAt target. Scroll progress (0→1) maps to curve t (0→1).

```js
import * as THREE from 'three'
import { easeInOutCubic } from '../utils/MathUtils.js'

// ── CAMERA PATH CONTROL POINTS ──────────────────────────────────────────────
// Edit these vectors to change the flight path.
// t values are approximate — the curve interpolates between them smoothly.

const POSITION_POINTS = [
  new THREE.Vector3(  0,   8,  60),  // t≈0.00  Hero: low, facing mountain range
  new THREE.Vector3(  0,  12,  38),  // t≈0.14  Approaching the mountain gap
  new THREE.Vector3( -8,  10,  14),  // t≈0.25  Left of left peak, entering pass
  new THREE.Vector3(  6,   9,  -2),  // t≈0.33  Right of right peak, tight corridor
  new THREE.Vector3(  0,  14, -18),  // t≈0.42  Exiting pass, cloud bank begins
  new THREE.Vector3(  0,  20, -38),  // t≈0.50  Deep inside cloud bank (peak fog)
  new THREE.Vector3(  0,  80, -55),  // t≈0.60  Burst out above clouds, drone height
  new THREE.Vector3( 18,  68, -80),  // t≈0.70  Pan right, forest canopy below
  new THREE.Vector3(  0,  45, -105), // t≈0.80  Descent begins, forest closer
  new THREE.Vector3(  0,  22, -128), // t≈0.90  Near ground level, logo approach
  new THREE.Vector3(  0,  18, -140), // t≈1.00  Footer: stationary resting position
]

const LOOKAT_POINTS = [
  new THREE.Vector3(  0,   4,   0),  // Look at mountain range center
  new THREE.Vector3(  0,   8,   0),  // Look toward the mountain gap
  new THREE.Vector3(  0,   8, -12),  // Look through the pass
  new THREE.Vector3(  0,   9, -25),  // Look ahead into cloud
  new THREE.Vector3(  0,  12, -45),  // Look into cloud bank ahead
  new THREE.Vector3(  0,  18, -60),  // Look further into clouds
  new THREE.Vector3(  0,   0, -65),  // Look DOWN at forest (drone shot)
  new THREE.Vector3(  8,  15, -98),  // Look down-forward right
  new THREE.Vector3(  0,  18, -115), // Look toward ground ahead
  new THREE.Vector3(  0,  20, -130), // Look toward logo position
  new THREE.Vector3(  0,  20, -142), // Footer: look straight ahead
]

export function createCameraRig(camera) {
  const positionCurve = new THREE.CatmullRomCurve3(POSITION_POINTS)
  const lookAtCurve   = new THREE.CatmullRomCurve3(LOOKAT_POINTS)

  // Current smooth lookAt target (lerped toward)
  const currentLookAt = new THREE.Vector3()

  // Mouse offset injected by MouseParallax.js (only active in footer)
  let mouseOffset = { x: 0, y: 0 }

  // Current scroll progress (0→1)
  let scrollProgress = 0

  function setProgress(p) {
    scrollProgress = p
  }

  function setMouseOffset(x, y) {
    mouseOffset = { x, y }
  }

  // Call every frame from SceneManager RAF
  function update(delta) {
    // Smooth the raw progress for cinematic camera lag
    const smoothT = easeInOutCubic(scrollProgress)

    const targetPos  = positionCurve.getPoint(smoothT)
    const targetLook = lookAtCurve.getPoint(smoothT)

    // Camera position: lerp with slight lag for weight
    camera.position.lerp(targetPos, 0.055)

    // LookAt: lerp separately so camera "turns" slightly after position
    currentLookAt.lerp(targetLook, 0.07)
    camera.lookAt(currentLookAt)

    // FOV: compress in mountain pass (t 0.22→0.38) for claustrophobia
    const targetFOV = getMountainFOV(scrollProgress)
    camera.fov += (targetFOV - camera.fov) * 0.04
    camera.updateProjectionMatrix()

    // Mouse parallax: only in footer (t > 0.88), blend in smoothly
    if (scrollProgress > 0.88) {
      const blend = Math.min((scrollProgress - 0.88) / 0.12, 1)
      camera.position.x += mouseOffset.x * 3.0 * blend
      camera.position.y += mouseOffset.y * 1.5 * blend
    }
  }

  function getMountainFOV(t) {
    if (t >= 0.22 && t <= 0.38) {
      const localT = (t - 0.22) / 0.16
      return 60 - Math.sin(localT * Math.PI) * 14  // 60 → 46 → 60
    }
    return 60
  }

  return { update, setProgress, setMouseOffset }
}
```

---

## CORE SYSTEM: `ScrollEngine.js`

```js
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function createScrollEngine({ cameraRig, textLayer, sceneManager, fogController }) {
  ScrollTrigger.create({
    trigger: '#scroll-driver',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress  // 0 → 1

      // Drive camera
      cameraRig.setProgress(p)

      // Drive text overlay
      textLayer.update(p)

      // Drive fog + lighting per scene
      fogController.update(p, sceneManager.scene, sceneManager.renderer)
    },
  })
}
```

---

## CORE SYSTEM: `FogController` (part of `SceneManager.js` or its own module)

Interpolates fog density, fog color, and renderer exposure across scene boundaries.

```js
// Scene lighting table — lerp between these as progress crosses boundaries
const SCENE_STATES = [
  // t     fogColor     fogDensity  exposure  ambientColor  ambientInt
  { t: 0.00, fog: 0x03050a, density: 0.004, exp: 1.00, amb: 0x1a2040, ambI: 0.40 },
  { t: 0.20, fog: 0x060810, density: 0.010, exp: 0.85, amb: 0x1a2040, ambI: 0.22 },
  { t: 0.38, fog: 0x8fa8cc, density: 0.030, exp: 1.40, amb: 0xffffff, ambI: 0.90 },
  { t: 0.47, fog: 0x8fa8cc, density: 0.038, exp: 1.50, amb: 0xffffff, ambI: 1.00 },  // cloud peak
  { t: 0.55, fog: 0x0a1a0f, density: 0.004, exp: 1.30, amb: 0x1a3020, ambI: 0.50 },
  { t: 0.75, fog: 0x0a1208, density: 0.005, exp: 1.20, amb: 0x1a2010, ambI: 0.50 },
  { t: 0.88, fog: 0x03050a, density: 0.008, exp: 1.00, amb: 0x0a0818, ambI: 0.30 },
  { t: 1.00, fog: 0x03050a, density: 0.008, exp: 1.00, amb: 0x0a0818, ambI: 0.30 },
]

// Find surrounding keyframes and lerp between them
// scene.fog.color and ambientLight.color interpolate per frame in update()
```

---

## SCENE BREAKDOWN

### SCENE 1 — HERO (t: 0.00 → 0.20)

**What the camera sees:** A dramatic mountain range at distance, deep-space sky,
stars slowly drifting. The scene breathes. Camera is low and wide.

**3D objects:**
- `SkyDome` — `THREE.SphereGeometry(800, 32, 16)` inverted (scale.y = -1), texture:
  `sky_night.jpg` (2048×1024 equirectangular, deep blue-purple→black gradient, faint
  star field baked in), `MeshBasicMaterial`, no lighting needed
- `Mountains` — centerpiece: generated heightmap mesh OR GLB
  - Heightmap approach: `PlaneGeometry(200, 80, 256, 128)` rotated -90° on X
    Displace Y vertices with `Math.abs(fbm(x * 0.05, z * 0.05))` × 45
    Texture: `mountain_rock.jpg` tiled 4×, normalMap: `mountain_rock_n.jpg`
    Material: `MeshStandardMaterial`, roughness 0.9, metalness 0.0
  - GLB approach: if `mountains.glb` is present in `public/models/`, load it with
    `GLTFLoader` and auto-center to bounding box; fallback to heightmap if absent
- `Mountains` silhouette wings — two flat `PlaneGeometry(80, 60)` planes at x=±120,
  dark `MeshBasicMaterial`, `side: THREE.DoubleSide`, texture: `mountain_silhouette.png`
  (dark mountain PNG with alpha — extends the range to fill screen edges)
- `Particles` — 800 points, random positions in a sphere r=300, size 0.6–0.8,
  white `PointsMaterial`, slow drift: each point drifts in a random direction at
  speed 0.01 per second, wraps when exiting sphere bounds

**Lighting:**
- `AmbientLight(0x1a2040, 0.40)`
- `DirectionalLight(0xffd4a0, 0.80)` at `position.set(80, 60, 30)` — warm far sun
- `DirectionalLight(0x4060ff, 0.25)` at `position.set(-50, 20, -30)` — cold moon fill
- `PointLight(0x4080ff, 0.35, 120)` at top of tallest peak — moonlight rim on peaks

**Text beats:**
```
id: 'hero-title'
  scrollIn:  0.00   scrollOut: 0.13
  animation: 'cinematic'
  position:  center (vertically centered, horizontally centered)
  elements:
    h1 class="text-hero" font-family=display font-weight=800 color=--text-primary
       content: "PROJECT NAME"   letter-spacing: -0.02em
    p  class="text-sub"  color=--text-dim  delay=400ms
       content: "Tagline that says what this is about"

id: 'hero-scroll-hint'
  scrollIn:  0.02   scrollOut: 0.15
  animation: 'float'
  position:  bottom-center  (bottom: 48px)
  elements:
    span class="text-label" color=--text-dim
         content: "↓  scroll to fly through"
         CSS: animation: pulseOpacity 2s ease-in-out infinite (0.4 ↔ 1.0)
```

**Exit transition:** hero-title and hint both exit at their `scrollOut` via `float` reverse.

---

### SCENE 2 — MOUNTAIN PASS (t: 0.20 → 0.38)

**What the camera sees:** Flying between two close mountain walls. FOV narrows.
Rock walls dominate the sides of frame. A shaft of moonlight comes from above.
Rock dust motes float past in camera direction.

**3D objects:**
- Left wall: `PlaneGeometry(40, 80, 4, 16)` at `position.set(-18, 20, 8)`,
  `rotation.y = Math.PI / 2`, slight procedural vertex noise on Z (±2 units max),
  same rock texture as mountains, `MeshStandardMaterial`
- Right wall: mirrored at `x = 18`, `rotation.y = -Math.PI / 2`
- Overhead gap: subtle `PointLight(0x6080c0, 0.60, 80)` at `(0, 45, 5)` — moonlight
  shaft through the gap above
- Dust particles: 240 small points constrained to the pass volume (x ±15, y ±20, z 30→-20)
  drift slowly in +Z camera direction at 0.008/s, `color: 0xaaaaaa`, size 0.3

**Visibility:** Both wall planes are added to scene in `HeroScene.js` at startup but set
`visible = false`. `MountainPass.js` sets `visible = true` at `t >= 0.18`.

**Text beats:**
```
id: 'pass-beat-1'
  scrollIn: 0.22   scrollOut: 0.30
  animation: 'cinematic'
  position: bottom-left  (left: 64px, bottom: 80px)
  elements:
    p class="text-label" color=--text-accent  letter-spacing=0.2em  UPPERCASE
      content: "ONE POOL"
    h2 class="text-section" color=--text-primary  weight=800
       content: "Every Function"
    p class="text-body" color=--text-dim  delay=300ms max-width=360px
      content: "Short supporting description line. One sentence max."

id: 'pass-beat-2'
  scrollIn: 0.31   scrollOut: 0.37
  animation: 'dust'
  position: right  (right: 80px, top: 50%, transform: translateY(-50%))
  elements:
    h3 class="text-section" color=--text-accent  font-family=mono
       content: "SWAP.\nLEND.\nBORROW."
       (each word on its own line, right-aligned)
```

**FOV:** Narrows from 60→46 peaking at t=0.29, back to 60 at t=0.38.
CameraRig `getMountainFOV()` handles this automatically.

---

### SCENE 3 — CLOUD BANK (t: 0.38 → 0.55)

**What the camera sees:** Entering a dense cloud bank. Fog density rises to near
whiteout. Giant cloud masses surround the camera. A single word materializes from
the fog itself, then dissolves back into it as we exit.

**3D objects:**

**Option A (default — try this first):**
- `Clouds.js` — 18 billboard planes arranged in a volume the camera passes through:
  - Each cloud: `PlaneGeometry(55, 35)` (NOT `Sprite` — Sprite has rotation issues)
  - `MeshBasicMaterial({ map: cloudTexture, transparent: true, depthWrite: false })`
  - `cloudTexture`: `cloud_sprite.png` — soft white/blue cloud with alpha edges
  - Positions scattered in a volume: x ±80, y 10→35, z -15→-55 (around the camera path)
  - Each cloud rotates toward camera each frame: `cloud.lookAt(camera.position)`
  - Slow ambient drift: each cloud has a random velocity `(±0.002, ±0.0005, 0)` per second
  - Alpha: 0.6–0.85 range (randomize per cloud at init)

**Option B (video fallback — use if FPS < 50 in testing):**
- Single `PlaneGeometry` sized to fill the camera frustum exactly at z-offset 8
- `VideoTexture` from `cloud_flight.mp4` (10–15s loop, H.264, 1280×720)
- `VideoManager.update(progress)` maps `progress (0.38→0.55)` → `video.currentTime`
- `USE_VIDEO_FALLBACK = false` flag at top of `CloudScene.js` — flip to `true` to switch

A `USE_VIDEO_FALLBACK` boolean at the top of `CloudScene.js`. Default `false`.
When `true`, skip cloud billboards and use video plane instead. All other logic stays.

**Text beats:**
```
id: 'cloud-beat'
  scrollIn: 0.43   scrollOut: 0.53
  animation: 'dust'    ← particles converge FROM cloud positions INTO text, hold, dissolve
  position: center
  elements:
    h2 class="text-hero" color=--text-cloud  font-family=display  weight=800
       content: "WHERE LIQUIDITY FLOWS"
       (text color matches fog — appears to emerge from it, then solidify to white)
       Start color: var(--text-cloud)  →  animate to var(--text-primary) over 1.0s
```

Note on `dust` animation in cloud scene: the canvas2D dust particles should use
color `#8fa8cc` (fog color) so they look like cloud particles condensing into text.

---

### SCENE 4 — ABOVE THE FOREST / DRONE VIEW (t: 0.55 → 0.75)

**What the camera sees:** Camera bursts out above the cloud layer — sudden brightness,
wide open sky above, a dense forest canopy filling the frame below. Camera is high,
looking slightly downward. Three feature text beats enter and exit as camera pans.

**3D objects:**
- `Forest.js` — two layers:
  - **Far layer (ground):** `PlaneGeometry(600, 600)` at `y=-8`, rotated -90° on X,
    `MeshBasicMaterial({ map: forestCanopyTexture })`, `forestCanopyTexture`:
    `forest_canopy.jpg` (aerial top-down forest photo, 1024×1024), UV repeat 1×1
  - **Near layer (instanced cones):** 500 cone-trees visible only when `camera.position.y < 75`
    Using the same `createConeTreeGeometry()` pattern from Project Wanderer.
    `MeshBasicMaterial({ color: '#0a1a08' })`, `frustumCulled: true`
    Scattered randomly: x ±150, z -30→-180, y=0
    Scale: random 0.8–2.5, random Y rotation
    `instancedMesh.count = 500`, `frustumCulled = true`
  - **Exit-cloud wisps:** 5–6 large semi-transparent `PlaneGeometry(120, 40)` planes
    at y=22–28, representing the cloud layer the camera just burst through
    `MeshBasicMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.25 })`
    Face camera (lookAt). Visible only t=0.55–0.65, fade out as camera rises.

**Video fallback for forest:** If instanced cones + canopy texture causes frame drops,
set `USE_VIDEO_FALLBACK = true` in `ForestScene.js`. Replaces near-layer instances
with a video plane (`forest_drone.mp4`) at y=0, facing camera, blended with far layer.

**Lighting:**
- `AmbientLight(0x1a3020, 0.50)`
- `DirectionalLight(0xffffff, 0.60)` at `(0, 100, 0)` — overhead sun
- Renderer exposure: 1.30 (brighter, clear-sky feeling)

**Text beats — 3 staggered beats, each ~0.065 scroll wide:**
```
id: 'forest-beat-a'
  scrollIn: 0.57   scrollOut: 0.63
  animation: 'reveal'          ← wipe from left
  position: left  (left: 64px, top: 50%, transform: translateY(-50%))
  elements:
    p class="text-label" color=--text-accent letter-spacing=0.2em
      content: "FOR LPs"
    h3 class="text-section" color=--text-primary weight=800
       content: "Deposit One Asset"
    p class="text-body" color=--text-dim delay=200ms max-width=340px
      content: "Earn from swaps, borrowing, and internal arbitrage. Single-sided."

id: 'forest-beat-b'
  scrollIn: 0.63   scrollOut: 0.69
  animation: 'cinematic'
  position: right  (right: 64px, top: 50%, transform: translateY(-50%))
  align: right
  elements:
    p class="text-label" color=--text-accent letter-spacing=0.2em
      content: "FOR BORROWERS"
    h3 class="text-section" color=--text-primary weight=800
       content: "Access Capital"
    p class="text-body" color=--text-dim delay=200ms max-width=340px
      content: "Single-asset collateral. A model built for changing markets."

id: 'forest-beat-c'
  scrollIn: 0.69   scrollOut: 0.75
  animation: 'typewriter'
  position: bottom-center  (bottom: 80px)
  elements:
    p class="text-label" color=--text-accent letter-spacing=0.2em
      content: "FOR TRADERS"
    h3 class="text-section" color=--text-primary weight=800
       content: "Better Execution"
    p class="text-body" color=--text-dim delay=200ms max-width=500px text-align=center
      content: "Direct swaps, cleaner routing, more efficient markets."
```

**Text exit:** Each beat exits via its animation reversed (`direction: 'out'`) before
the next beat's `scrollIn` point. No two beats are visible simultaneously.

---

### SCENE 5 — THE DESCENT (t: 0.75 → 0.88)

**What the camera sees:** Camera descends from y=68 toward y=22. Forest is now below
and surrounding. Warm evening light. Tiny glowing firefly particles drift up past the
camera. A dramatic single-line statement glitches in and settles.

**3D objects:**
- Forest `Forest.js` continues from Scene 4 (same objects, still visible)
- `Particles.js` second system — fireflies:
  - 280 points, `PointsMaterial({ color: 0xaaffaa, size: 0.4 })`
  - Each firefly: random position x±60, y 0→30, z around camera path ±40
  - Drift: slow upward y + slow random XZ drift, wrap when exiting bounds
  - Subtle pulse: each particle has a phase offset, brightness oscillates
    via `material.opacity` (`sin(time + phase) * 0.3 + 0.7`)
- Torchlight: `PointLight(0xffaa44, 2.5, 35)` attached to `camera.position + (0, -5, 0)`
  — as if the camera itself carries warm light
- Directional light color lerps from `0xffffff` → `0xffcc88` (golden hour)

**Text beats:**
```
id: 'descent-glitch'
  scrollIn: 0.77   scrollOut: 0.85
  animation: 'glitch'
  position: center
  elements:
    h2 class="text-hero" color=--text-gold font-family=display weight=800
       content: "ReDeFined"
    p class="text-sub" color=--text-dim delay=900ms   ← delay until glitch settles
      content: "A new model for deeper, cleaner, more efficient liquidity."

id: 'descent-sub'
  scrollIn: 0.84   scrollOut: 0.88
  animation: 'reveal'
  position: bottom-right (right: 80px, bottom: 64px)
  align: right
  elements:
    p class="text-label" color=--text-dim letter-spacing=0.15em
      content: "Building a more capital-efficient foundation"
```

**Vignette:** At t=0.85, a CSS vignette overlay (div in text-layer) begins fading in:
`background: radial-gradient(ellipse at center, transparent 40%, rgba(3,5,10,0.85) 100%)`
Reaches full opacity by t=0.90. This eases the transition to the footer.

---

### SCENE 6 — FOOTER / SUMMIT (t: 0.88 → 1.00)

**What the camera sees:** Near-stationary. Dark, deep space feeling. All previous
scene objects fade out. A logo draws itself on. Stars fade back in. Contact links
appear. A fluid shader animates subtly in the background. Mouse moves the scene.

**3D objects — fade out:**
All scene objects from previous scenes have a `sceneFadeOut(t)` method.
From t=0.88 to t=0.92 each object lerps its material opacity (or uniform `u_alpha`) 0→1→0.
By t=0.92 they are invisible. Do NOT `.remove()` them from scene — just make invisible.

**3D objects — footer only:**
- `SkyStars` (same as Project Wanderer): 1200 points, sphere r=400, slow drift
  Fades IN from t=0.90 to t=0.95 (`material.opacity` 0→1)
- Background shader plane:
  `PlaneGeometry(50, 28)` at `camera.position + (0, 0, -12)` — updates position
  each frame to follow camera, always filling the frustum
  Material: custom `ShaderMaterial` (see Footer Shader below)
  This is the "fluid animation in the background as mouse moves" element.

**`LogoMesh.js` — logo draw-on:**
Option A (recommended): SVG logo overlay in `#text-layer`.
- Logo `<img>` or inline `<svg>` element, centered, white, max-width 200px
- CSS `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)` transition over 1.2s
  triggered by Anime.js when `progress >= 0.90`
- After draw-on completes (1.3s), a subtle glow pulse CSS animation on the logo

Option B: `THREE.ExtrudeGeometry` from SVG path (use `SVGLoader` from
`three/examples/jsm/loaders/SVGLoader`), animate `scale` 0→1 + dissolve shader.
Only use B if the logo needs to be 3D in the scene.

**Mouse parallax (`MouseParallax.js`):**
```js
// Track normalized mouse (-1 → +1)
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth)  * 2 - 1
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1
})

// In update loop — inject into CameraRig
cameraRig.setMouseOffset(mouseX, mouseY)

// Also update footer shader uniform:
footerMaterial.uniforms.u_mouse.value.set(mouseX, mouseY)
```

**Footer background shader:**
```glsl
// VERTEX
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// FRAGMENT
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
  // Mouse shifts UV slightly for parallax
  vec2 uv = vUv + u_mouse * 0.08;
  uv += vec2(u_time * 0.012, u_time * 0.008);

  float n = fbm(uv * 2.5 + fbm(uv * 1.8 + vec2(u_time * 0.03)));

  // Color ramp: near-black → deep navy → dark purple
  vec3 c0 = vec3(0.01, 0.02, 0.04);   // near black
  vec3 c1 = vec3(0.04, 0.07, 0.18);   // deep navy
  vec3 c2 = vec3(0.08, 0.03, 0.18);   // dark purple

  vec3 col;
  if(n < 0.5) col = mix(c0, c1, n * 2.0);
  else        col = mix(c1, c2, (n - 0.5) * 2.0);

  // Very subtle — barely visible, ambient motion only
  col *= u_brightness * 0.8;
  gl_FragColor = vec4(col, 1.0);
}
```

**Footer text beats:**
```
id: 'footer-tagline'
  scrollIn: 0.91   scrollOut: never (stays until end)
  animation: 'typewriter'
  position: bottom-center (bottom: 160px)
  elements:
    p class="text-label" color=--text-dim letter-spacing=0.25em font-family=mono
      content: "STAY CLOSE TO THE SUMMIT"

id: 'footer-links'
  scrollIn: 0.93   scrollOut: never
  animation: 'float' with stagger (each link 120ms apart)
  position: bottom-center (bottom: 80px)
  elements:
    div class="footer-links" (horizontal flex row, gap: 40px)
      a href="https://t.me/..." class="footer-link"
        content: "Telegram"  prefix: "↗"  color=--text-primary
      a href="https://x.com/..." class="footer-link"
        content: "Twitter"   prefix: "↗"  color=--text-primary

id: 'footer-copy'
  scrollIn: 0.96   scrollOut: never
  animation: 'float'
  position: bottom-center (bottom: 24px)
  elements:
    p class="text-label" color=--text-dim
      content: "© 2025 PROJECT NAME  ·  All rights reserved"
```

**Footer link hover (CSS + Anime.js):**
```css
.footer-link {
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.15em;
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.2s, letter-spacing 0.3s var(--ease-cinema);
}
.footer-link:hover {
  color: var(--text-accent);
  letter-spacing: 0.25em;
}
```

---

## TEXT ANIMATION CATALOG (`text/animations/`)

Each animation function signature: `animate(element, direction)` where `direction`
is `'in'` or `'out'`. Returns the Anime.js animation instance (so callers can await
or chain). All animations must call `element.style.display = 'block'` before playing
`'in'` and set `display: 'none'` after `'out'` completes.

### `cinematic.js`
```js
import anime from 'animejs'
export function cinematic(el, dir) {
  return anime({
    targets: el,
    translateY: dir === 'in' ? [50, 0] : [0, -40],
    opacity:    dir === 'in' ? [0, 1]  : [1, 0],
    letterSpacing: dir === 'in' ? ['0.25em', '0.03em'] : undefined,
    duration:   dir === 'in' ? 1200 : 600,
    easing:     dir === 'in' ? 'easeOutExpo' : 'easeInQuart',
    complete:   dir === 'out' ? () => { el.style.display = 'none' } : undefined,
  })
}
```

### `dust.js`
Canvas2D particle technique:
1. Create an offscreen `<canvas>` same size as bounding box of `el`
2. Render `el.textContent` onto offscreen canvas using same font/size
3. Sample pixel data — collect all non-transparent pixel positions
4. For IN: spawn particles scattered in a radius, Anime.js moves them to pixel positions
5. For OUT: reverse — particles at text positions scatter outward then fade
6. The `el` itself stays `opacity: 0` while canvas animates; canvas overlays it
7. On complete (IN): `el.style.opacity = 1`, remove canvas. On complete (OUT): vice versa.

Use a `<canvas>` absolutely positioned sibling to `el`, same parent container.
Particle motion uses anime's `keyframes` with random intermediate positions.

Approximate particle count: `pixelCount / 8` (sample every 8th filled pixel).
Color: match text color. Duration: 1400ms in, 900ms out.

### `typewriter.js`
```js
import anime from 'animejs'
export function typewriter(el, dir) {
  // Pre-split: wrap each character in <span class="char">
  if (!el.dataset.split) {
    el.innerHTML = el.textContent.split('').map(c =>
      c === ' ' ? ' ' : `<span class="char" style="opacity:0">${c}</span>`
    ).join('')
    el.dataset.split = 'true'
  }
  const chars = el.querySelectorAll('.char')
  return anime({
    targets: chars,
    opacity: dir === 'in' ? [0, 1] : [1, 0],
    delay: anime.stagger(dir === 'in' ? 38 : 18),
    duration: 160,
    easing: 'linear',
    complete: dir === 'out' ? () => { el.style.display = 'none' } : undefined,
  })
}
```

Add cursor: after the last char, append a `<span class="cursor">|</span>` that blinks
via CSS `animation: cursorBlink 0.8s step-end infinite`. Remove cursor on OUT.

### `glitch.js`
```js
export function glitch(el, dir) {
  if (dir === 'out') {
    return anime({ targets: el, opacity: [1, 0], duration: 500, easing: 'easeInQuart',
      complete: () => { el.style.display = 'none' } })
  }
  // IN: 3 jitter cycles using CSS class, then settle
  el.style.opacity = 1
  let count = 0
  const interval = setInterval(() => {
    el.classList.toggle('glitch-active')
    count++
    if (count >= 6) {
      clearInterval(interval)
      el.classList.remove('glitch-active')
    }
  }, 120)
}
```

CSS for `.glitch-active` (in `text.css`):
```css
.glitch-active {
  position: relative;
}
.glitch-active::before,
.glitch-active::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}
.glitch-active::before {
  color: #ff0040;
  transform: translate(-3px, 2px);
  clip-path: inset(20% 0 60% 0);
}
.glitch-active::after {
  color: #00ffff;
  transform: translate(3px, -2px);
  clip-path: inset(60% 0 20% 0);
}
```
Set `data-text` attribute on the element to match its text content before animating.

### `reveal.js`
```js
import anime from 'animejs'
export function reveal(el, dir) {
  return anime({
    targets: el,
    clipPath: dir === 'in'
      ? ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
      : ['inset(0 0% 0 0)', 'inset(0 0% 100% 0)'],
    duration: dir === 'in' ? 900 : 700,
    easing: 'easeInOutQuart',
    complete: dir === 'out' ? () => { el.style.display = 'none' } : undefined,
  })
}
```

### `float.js`
```js
import anime from 'animejs'
export function float(el, dir) {
  return anime({
    targets: el,
    translateY: dir === 'in' ? [24, 0] : [0, 24],
    opacity:    dir === 'in' ? [0, 1]  : [1, 0],
    duration: dir === 'in' ? 900 : 600,
    easing: 'easeOutSine',
    complete: dir === 'out' ? () => { el.style.display = 'none' } : undefined,
  })
}
```

---

## TEXT LAYER SYSTEM (`text/TextLayer.js`)

All text beats are defined in a single config array at the top of this file.
The `update(progress)` method is called every scroll frame.

```js
const TEXT_BEATS = [
  /* ... all beats as defined in each scene section above ... */
]

export function createTextLayer(containerEl) {
  // Mount all beat elements to containerEl (hidden by default)
  // Each beat: create a wrapper div.text-beat, position per beat.position,
  // append child elements per beat.elements spec

  function update(progress) {
    for (const beat of TEXT_BEATS) {
      const shouldBeVisible =
        progress >= beat.scrollIn &&
        (beat.scrollOut === 'never' || progress < beat.scrollOut)

      if (shouldBeVisible && !beat._visible) {
        beat._visible = true
        showBeat(beat)
      } else if (!shouldBeVisible && beat._visible) {
        beat._visible = false
        hideBeat(beat)
      }
    }
  }

  // ... mount, show, hide implementations
  return { update }
}
```

**Position classes (in `text.css`):**
```css
.text-beat { position: fixed; pointer-events: none; }
.text-beat.center     { left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; }
.text-beat.bottom-center { left: 50%; bottom: 64px; transform: translateX(-50%); text-align: center; }
.text-beat.bottom-left   { left: 64px; bottom: 80px; }
.text-beat.bottom-right  { right: 64px; bottom: 80px; text-align: right; }
.text-beat.left  { left: 64px; top: 50%; transform: translateY(-50%); }
.text-beat.right { right: 64px; top: 50%; transform: translateY(-50%); text-align: right; }
```

---

## ASSET LOADER (`core/AssetLoader.js`)

Manages loading screen. All scene `init()` functions call `AssetLoader.load(url, type)`
to register assets. Loader tracks total vs loaded count and updates `#loader-bar` width.

```js
// Loading phases:
// Phase 1 (required): sky texture, mountain texture — BLOCK scene start
// Phase 2 (optional): cloud sprite, forest texture — show progress bar
// Phase 3 (lazy): video elements — preload in background, don't block

// On 100% loaded:
// 1. Render one THREE.js frame
// 2. Fade out #loader: opacity 1→0 over 600ms
// 3. After fade: display:none on #loader, pointer-events on #text-layer active

// #loader-bar: width transitions from 0% → 100% as assets load
// Use CSS transition: width 0.3s ease for smooth bar animation
```

**Required assets in `public/` directory:**
```
public/
  textures/
    sky_night.jpg             2048×1024  — equirectangular sky (stars + gradient)
    mountain_rock.jpg          512×512   — tileable rock diffuse
    mountain_rock_n.jpg        512×512   — rock normal map
    mountain_silhouette.png    1024×512  — dark mountain PNG with alpha (side wings)
    forest_canopy.jpg          1024×1024 — aerial top-down forest photo
    cloud_sprite.png           512×512   — single cloud puff with alpha
  models/
    mountains.glb              optional  — low-poly mountain range GLB
  video/
    cloud_flight.mp4           optional  — 10–15s H.264 1280×720 loop
    forest_drone.mp4           optional  — 5–10s H.264 drone forest footage
```

If a `public/models/mountains.glb` file is NOT present, `Mountains.js` falls back
to the procedural heightmap approach. Never throw — always fall back gracefully.

---

## VIDEO MANAGER (`video/VideoManager.js`)

```js
// Creates and manages <video> elements for THREE.VideoTexture use
// Videos are hidden from DOM (position: absolute, opacity: 0, pointer-events: none)

export function createVideoManager() {
  const videos = {}

  function register(id, src) {
    const el = document.createElement('video')
    el.src = src
    el.loop = true
    el.muted = true
    el.playsInline = true
    el.preload = 'auto'
    el.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px'
    document.body.appendChild(el)

    const texture = new THREE.VideoTexture(el)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    videos[id] = { el, texture }
    return texture
  }

  // Map scroll progress range to video currentTime
  function seekTo(id, progress, rangeStart, rangeEnd) {
    const v = videos[id]
    if (!v) return
    const localP = Math.max(0, Math.min(1, (progress - rangeStart) / (rangeEnd - rangeStart)))
    if (!v.el.paused) v.el.pause()
    v.el.currentTime = localP * v.el.duration
  }

  function play(id) { videos[id]?.el.play() }
  function pause(id) { videos[id]?.el.pause() }

  return { register, seekTo, play, pause }
}
```

---

## MOBILE ADAPTATION

Detect at startup: `const isMobile = window.innerWidth < 768`

| Setting | Desktop | Mobile |
|---|---|---|
| Pixel ratio cap | 1.5 | 1.0 |
| Star particles | 800 | 200 |
| Cloud billboards | 18 | 6 (or always video) |
| Firefly particles | 280 | 80 |
| Forest cones | 500 | 0 (texture plane only) |
| Dust motes in pass | 240 | 60 |
| `lerp` factor | 0.055 | 0.09 (faster, lower lag for mobile feel) |
| `scroll-driver` height | 600vh | 500vh |

Apply mobile overrides in `main.js` before any scene `init()` call.

---

## `prefers-reduced-motion` SUPPORT

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (reduced) {
  // Camera lerp factor → 0.5 (near-instant position snap)
  // All animation durations multiply by 0.15
  // Particle systems: count = 0 (hide all)
  // Clouds: opacity 0 (hide sprites)
  // Video: do not autoplay
  // Footer shader: u_timeScale = 0 (freeze fluid)
}
```

---

## PERFORMANCE RULES

| Rule | Spec |
|---|---|
| Renderer pixel ratio | max 1.5 |
| Renderer shadow maps | DISABLED — use baked lighting only |
| Post-processing passes | NONE — use fog + CSS for atmosphere |
| Draw calls target | < 30 per frame |
| Instanced mesh max | 500 instances (forest cones) |
| Texture uploads | max 80MB total |
| New `THREE.Color()` in RAF | NEVER — pre-allocate, lerp in-place |
| New `THREE.Vector3()` in RAF | NEVER — use `.set()` on existing vectors |
| Video autoplay | Only when `prefers-reduced-motion: no-preference` |
| `geometry.dispose()` on scene exit | ALWAYS |
| `material.dispose()` on scene exit | ALWAYS |
| `texture.dispose()` on scene exit | ALWAYS |

Do NOT use `THREE.ExtrudeGeometry` on logo if `SVGLoader` requires font loading.
Do NOT add more than 3 `PointLight` instances to scene simultaneously.
Do NOT use `scene.traverse()` inside the RAF loop — cache all mesh/material references.

---

## WHAT NOT TO DO

- Do NOT use React, Vue, or any component framework — pure ES modules
- Do NOT use `OrbitControls` — camera is 100% path-driven by scroll
- Do NOT animate the DOM or body scroll position — body stays pinned, scroll driver creates height
- Do NOT use `window.addEventListener('scroll', ...)` — use GSAP ScrollTrigger exclusively
- Do NOT use `position: absolute` for text beats — all text is `position: fixed`
- Do NOT use `new THREE.Color()`, `new THREE.Vector3()`, or any allocation inside the RAF loop
- Do NOT add `ShadowMap`, `EffectComposer`, or any post-processing — too expensive, breaks budget
- Do NOT use `TextGeometry` for UI text — HTML overlays only; 3D text only if explicitly 3D world-text
- Do NOT skip `dispose()` — every geometry/material/texture must be disposed when its scene exits
- Do NOT load video assets eagerly — only preload when the relevant scene is within 0.1 scroll units
- Do NOT set camera using `camera.position.set()` inside the RAF loop — lerp only
- Do NOT block the RAF loop for asset loading — show loading screen, then start scene
- Do NOT put the scroll-driver height in JavaScript — it is `600vh` in the HTML, change only that

---

## MAIN ENTRY (`main.js`)

```js
import { createSceneManager } from './core/SceneManager.js'
import { createCameraRig }    from './core/CameraRig.js'
import { createScrollEngine } from './core/ScrollEngine.js'
import { createTextLayer }    from './text/TextLayer.js'
import { AssetLoader }        from './core/AssetLoader.js'

import { HeroScene }       from './scenes/HeroScene.js'
import { MountainPass }    from './scenes/MountainPass.js'
import { CloudScene }      from './scenes/CloudScene.js'
import { ForestScene }     from './scenes/ForestScene.js'
import { DescentScene }    from './scenes/DescentScene.js'
import { FooterScene }     from './scenes/FooterScene.js'
import { MouseParallax }   from './utils/MouseParallax.js'

async function init() {
  // 1. Boot core
  const sm     = createSceneManager(document.getElementById('canvas-container'))
  const rig    = createCameraRig(sm.camera)
  const text   = createTextLayer(document.getElementById('text-layer'))
  const mouse  = MouseParallax.create(rig)

  // 2. Load required assets (blocks until complete, updates loader bar)
  await AssetLoader.loadCritical()

  // 3. Init scenes (each adds objects to sm.scene)
  const hero     = HeroScene.init(sm.scene, sm.renderer)
  const pass     = MountainPass.init(sm.scene)
  const cloud    = CloudScene.init(sm.scene, sm.camera)
  const forest   = ForestScene.init(sm.scene)
  const descent  = DescentScene.init(sm.scene, sm.camera)
  const footer   = FooterScene.init(sm.scene, sm.camera)

  // 4. Register RAF updates
  sm.register((delta) => rig.update(delta))
  sm.register((delta) => hero.update(delta))
  sm.register((delta) => cloud.update(delta, sm.scene.fog))
  sm.register((delta) => footer.update(delta, sm.camera))
  sm.register((delta) => AssetLoader.loadSecondary(delta)) // lazy-load remaining assets

  // 5. Wire scroll engine (drives camera + text + fog from scroll progress)
  createScrollEngine({ cameraRig: rig, textLayer: text, sceneManager: sm })

  // 6. Start RAF loop
  sm.startLoop()

  // 7. Hide loader
  AssetLoader.hideLoader()
}

init()
```

---

## DELIVERABLE

`npm install && npm run dev` produces:

1. A loading screen with progress bar that hides when assets are ready
2. A pinned single-page Three.js camera flight triggered entirely by scroll
3. 6 distinct atmospheric scenes with correct fog, lighting, and objects per scene
4. All 9 text beats appearing and disappearing at correct scroll positions with the
   specified animation for each beat (cinematic, dust, typewriter, glitch, reveal, float)
5. Correct FOV compression (60→46→60) during mountain pass
6. Cloud billboards (or video fallback) with correct fog density curve peaking at t=0.47
7. Instanced forest canopy visible from drone view, correctly frustum-culled
8. Firefly particles and torchlight active during descent scene
9. Footer: logo draw-on, contact links with hover effects, fluid shader background,
   mouse parallax active on camera and shader
10. Mobile adaptation active when `window.innerWidth < 768`
11. `prefers-reduced-motion` respected throughout
12. All assets load from `public/` — `npm run build` produces a deployable `dist/`
13. 60fps on mid-range desktop. Any scene that drops below 50fps has its video fallback
    flag enabled as the first performance fix.