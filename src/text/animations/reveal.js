import anime from 'animejs';

export function reveal(el, dir) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeScale = reduced ? 0.15 : 1;
  if (dir === 'in') {
    el.style.display = 'block';
  }

  return anime({
    targets: el,
    clipPath: dir === 'in'
      ? ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
      : ['inset(0 0% 0 0)', 'inset(0 0% 100% 0)'],
    duration: (dir === 'in' ? 900 : 700) * timeScale,
    easing: 'easeInOutQuart',
    complete: dir === 'out' ? () => { el.style.display = 'none'; } : undefined,
  });
}
