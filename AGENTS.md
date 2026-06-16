# AGENTS.md — Cinematic 3D Camera-Flight Website

## Project Identity

Single-page cinematic 3D experience. Scrolling moves a Three.js camera along a
spline path through a world — the DOM never scrolls. Six distinct atmospheric
scenes. Text overlays are HTML elements. This is not a scroll-animation site;
it is a VR camera flight triggered by scroll input.

---

## Tech Stack

- **Vite** (vanilla JS — no React, no Vue, no Svelte)
- **Three.js r160** — import from `three`
- **GSAP 3.12** + **ScrollTrigger** — scroll progress → camera path only
- **Anime.js 3.2** — text and UI element animations only
- **No post-processing** — no `EffectComposer`, no bloom, no SMAA
- **No OrbitControls** — camera is 100% path-driven, never user-controlled
- **No physics**

---

## Directory Structure

```
src/
  main.js
  core/
    SceneManager.js       # Renderer, scene, clock, RAF loop, resize
    CameraRig.js          # Camera + CatmullRomCurve3 + scroll-driven update
    ScrollEngine.js       # GSAP ScrollTrigger — dispatches progress to all systems
    AssetLoader.js        # Preload textures + GLBs + videos; loading screen
  scenes/
    HeroScene.js          # t=0.00–0.20
    MountainPass.js       # t=0.20–0.38
    CloudScene.js         # t=0.38–0.55
    ForestScene.js        # t=0.55–0.75
    DescentScene.js       # t=0.75–0.88
    FooterScene.js        # t=0.88–1.00
  objects/
    Mountains.js
    SkyDome.js
    Clouds.js
    Forest.js
    Particles.js
    LogoMesh.js
  text/
    TextLayer.js
    animations/
      cinematic.js
      dust.js
      typewriter.js
      glitch.js
      reveal.js
      float.js
  video/
    VideoManager.js
  utils/
    MouseParallax.js
    MathUtils.js
  styles/
    globals.css
    text.css
    loader.css
index.html
vite.config.js
package.json
```

---

## Entry Point: `index.html`

The `#scroll-driver` div (`height: 600vh`) creates scrollable height.
The body/DOM never moves. `#canvas-container` and `#text-layer` are both
`position: fixed; inset: 0`. Do NOT change the scroll-driver height in JS —
change only the inline style value in HTML.

---

## How to Run

```bash
npm install
npm run dev     # Vite dev server, hot reload
npm run build   # Produces deployable dist/
```

---

## How Jules Should Validate Without a Browser

Jules cannot open a browser. For each task, validate by:

1. `npm run build` must complete with zero errors
2. No new packages added unless the task explicitly requires one
3. No `new THREE.Color()`, `new THREE.Vector3()`, or any heap allocation inside any
   function called from the RAF loop (check all `update(delta)` functions)
4. Every new `Geometry`, `Material`, or `Texture` created must have a corresponding
   `.dispose()` call in that module's cleanup/destroy path
5. No `scene.traverse()` calls inside RAF loop
6. No `window.addEventListener('scroll', ...)` — GSAP ScrollTrigger only
7. `npm run lint` if a lint script exists

---

## Camera System

- `CameraRig.js` owns two `CatmullRomCurve3` paths: position + lookAt
- Scroll progress (0→1) → `positionCurve.getPoint(smoothT)` and `lookAtCurve.getPoint(smoothT)`
- Camera position lerps toward target: `camera.position.lerp(target, 0.055)`
- LookAt lerps separately: `currentLookAt.lerp(target, 0.07)`
- FOV compresses 60→46→60 during mountain pass (t=0.22–0.38) via `getMountainFOV()`
- Mouse parallax only active when `scrollProgress > 0.88` (footer scene)
- **NEVER use `camera.position.set()` in the RAF loop — lerp only**

---

## Scroll Engine

- `ScrollEngine.js` uses a single `ScrollTrigger.create()` on `#scroll-driver`
- `onUpdate` receives `self.progress` (0→1) and dispatches to: `cameraRig.setProgress()`,
  `textLayer.update()`, `fogController.update()`
- No other scroll listeners anywhere in the codebase

---

## Scene System

Each scene module exports an `init(scene, ...args)` and an `update(delta)`.
Scenes do not remove themselves — they set `object.visible = false` when inactive.
Dispose is only called at full app teardown.

### Scene Boundaries (scroll progress t)

| Scene         | t start | t end |
|---------------|---------|-------|
| HeroScene     | 0.00    | 0.20  |
| MountainPass  | 0.20    | 0.38  |
| CloudScene    | 0.38    | 0.55  |
| ForestScene   | 0.55    | 0.75  |
| DescentScene  | 0.75    | 0.88  |
| FooterScene   | 0.88    | 1.00  |

Objects from previous scenes stay in the scene graph but are set to
`visible = false` as progress advances. Do not `.remove()` them.

---

## Fog / Lighting Controller

Interpolates fog color, fog density, renderer exposure, and ambient light color
between 8 keyframes keyed to scroll progress t. Lerp in-place using pre-allocated
`THREE.Color` objects — never allocate new ones inside the update loop.

---

## Text Layer System (`text/TextLayer.js`)

- All text beats defined in a single `TEXT_BEATS` config array
- `update(progress)` called every scroll frame — checks each beat's `scrollIn`/`scrollOut`
- Each beat has an `animation` key: `'cinematic'`, `'dust'`, `'typewriter'`, `'glitch'`,
  `'reveal'`, or `'float'`
- All beat wrappers: `position: fixed; pointer-events: none`
- Links inside text-layer: `pointer-events: auto`
- `scrollOut: 'never'` means the beat stays visible from its `scrollIn` to end of page

### Animation Module Contract

Every animation in `text/animations/*.js` exports a single function:

```js
animate(element, direction)   // direction: 'in' | 'out'
```

- Must set `element.style.display = 'block'` before playing `'in'`
- Must set `element.style.display = 'none'` after `'out'` completes
- Returns an Anime.js animation instance

---

## Fog + Video Fallback Flags

Each scene that has a video fallback has a flag at the top of its file:

```js
const USE_VIDEO_FALLBACK = false   // flip to true to swap 3D objects for video plane
```

`VideoManager.js` manages `<video>` element lifecycle + `THREE.VideoTexture`.
Video elements are hidden from DOM. `seekTo(id, progress, rangeStart, rangeEnd)`
maps scroll progress to `video.currentTime`.

---

## Asset Loading

Assets live in `public/`:

```
public/
  textures/
    sky_night.jpg           (2048×1024 equirectangular)
    mountain_rock.jpg       (512×512 tileable)
    mountain_rock_n.jpg     (512×512 normal map)
    mountain_silhouette.png (1024×512 with alpha)
    forest_canopy.jpg       (1024×1024)
    cloud_sprite.png        (512×512 with alpha)
  models/
    mountains.glb           (optional — heightmap fallback if absent)
  video/
    cloud_flight.mp4        (optional)
    forest_drone.mp4        (optional)
```

If `mountains.glb` is absent, `Mountains.js` silently falls back to procedural
heightmap. Never throw on missing optional assets.

Phase 1 assets (sky, mountain textures) block scene start.
Phase 2 assets (cloud, forest) show progress bar.
Phase 3 (video) lazy-loads in background, never blocks.

---

## Mobile Adaptation

Detect at startup: `const isMobile = window.innerWidth < 768`

| Setting             | Desktop | Mobile |
|---------------------|---------|--------|
| Pixel ratio cap     | 1.5     | 1.0    |
| Star particles      | 800     | 200    |
| Cloud billboards    | 18      | 6      |
| Firefly particles   | 280     | 80     |
| Forest cones        | 500     | 0      |
| Dust motes in pass  | 240     | 60     |
| Camera lerp factor  | 0.055   | 0.09   |
| scroll-driver height| 600vh   | 500vh  |

Apply all mobile overrides in `main.js` before any scene `init()` call.

---

## `prefers-reduced-motion` Support

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

When true:

- Camera lerp → 0.5 (near-instant snap)
- All Anime.js durations × 0.15
- All particle systems: count = 0
- Cloud sprites: opacity = 0
- Footer shader: freeze `u_time` (pass `u_timeScale = 0`)
- Videos: do not autoplay

---

## Performance Constraints (non-negotiable)

| Rule                                      | Limit         |
|-------------------------------------------|---------------|
| Renderer shadow maps                      | DISABLED      |
| Post-processing passes                    | NONE          |
| Draw calls per frame target               | < 30          |
| Instanced mesh max (forest cones)         | 500           |
| Point lights simultaneously               | ≤ 3           |
| Pixel ratio cap                           | 1.5 desktop   |
| `new THREE.Color()` inside RAF            | NEVER         |
| `new THREE.Vector3()` inside RAF          | NEVER         |
| `scene.traverse()` inside RAF             | NEVER         |
| Missing `.dispose()` on any new resource  | NOT ALLOWED   |

---

## WHAT JULES MUST NEVER DO

- Install React, Vue, Svelte, or any component framework
- Use `OrbitControls` — camera is path-driven only
- Use `window.addEventListener('scroll', ...)` — GSAP ScrollTrigger only
- Animate DOM scroll position or body position
- Allocate any Three.js object (`new THREE.Vector3`, `new THREE.Color`, etc.) inside
  the RAF loop or any function called from it
- Add `EffectComposer`, `BloomPass`, or any post-processing
- Use `THREE.TextGeometry` — all text is HTML overlays
- Use `position: absolute` for text beats — all text is `position: fixed`
- Add more than 3 `PointLight` instances to the scene simultaneously
- Use `camera.position.set()` inside the RAF loop
- Load video assets eagerly — only when the relevant scene is within 0.1 scroll units
- Skip `.dispose()` on any geometry, material, or texture
- Put the scroll-driver height in JavaScript — it is `600vh` in the HTML

---

## PR Expectations

Each PR Jules opens must include:

- Plain-English summary of what changed and why
- List of any new Three.js objects created (geometry, material, texture) and where
  their `.dispose()` lives
- Confirmation that `npm run build` passed with zero errors
- Note on any RAF-touched code and whether allocations were audited

## Full Spec Reference

The complete scene-by-scene technical spec (camera waypoints, text beats, shader code,
asset list, scene breakdown) is in `.agents/workflows/cinematic-spec.md`.
Read it before implementing anything in `src/scenes/`, `src/objects/`, `src/text/`,
or `src/core/CameraRig.js`.
