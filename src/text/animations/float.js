import anime from 'animejs';

export function float(el, dir) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeScale = reduced ? 0.15 : 1;
  if (dir === 'in') {
    el.style.display = 'block';
  }

  return anime({
    targets: el,
    translateY: dir === 'in' ? [24, 0] : [0, 24],
    opacity:    dir === 'in' ? [0, 1]  : [1, 0],
    duration: (dir === 'in' ? 900 : 600) * timeScale,
    easing: 'easeOutSine',
    complete: dir === 'out' ? () => { el.style.display = 'none'; } : undefined,
  });
}
