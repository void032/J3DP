import anime from 'animejs';

export function reveal(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }

  return anime({
    targets: el,
    clipPath: dir === 'in'
      ? ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
      : ['inset(0 0% 0 0)', 'inset(0 0% 100% 0)'],
    duration: dir === 'in' ? 900 : 700,
    easing: 'easeInOutQuart',
    complete: dir === 'out' ? () => { el.style.display = 'none'; } : undefined,
  });
}
