import * as THREE from 'three';

export function createVideoManager() {
  const videos = {};

  function register(id, src) {
    const el = document.createElement('video');
    el.src = src;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px';
    document.body.appendChild(el);

    const texture = new THREE.VideoTexture(el);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    videos[id] = { el, texture };
    return texture;
  }

  // Map scroll progress range to video currentTime
  function seekTo(id, progress, rangeStart, rangeEnd) {
    const v = videos[id];
    if (!v) return;
    const localP = Math.max(0, Math.min(1, (progress - rangeStart) / (rangeEnd - rangeStart)));
    if (!v.el.paused) v.el.pause();

    // Only seek if we have a duration to avoid NaN
    if (v.el.duration) {
      v.el.currentTime = localP * v.el.duration;
    }
  }

  function play(id) { videos[id]?.el.play(); }
  function pause(id) { videos[id]?.el.pause(); }

  function dispose(id) {
    const v = videos[id];
    if (v) {
      v.el.pause();
      v.el.removeAttribute('src');
      v.el.load();
      v.el.remove();
      v.texture.dispose();
      delete videos[id];
    }
  }

  return { register, seekTo, play, pause, dispose };
}

export const VideoManager = createVideoManager();
