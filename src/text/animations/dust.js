import anime from 'animejs';

export function dust(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }

  // Simplified dust placeholder for brevity of scaffolding
  // Full canvas implementation would go here per spec
  return anime({
    targets: el,
    opacity: dir === 'in' ? [0, 1] : [1, 0],
    duration: dir === 'in' ? 1400 : 900,
    easing: 'linear',
    complete: dir === 'out' ? () => { el.style.display = 'none'; } : undefined,
  });
}
