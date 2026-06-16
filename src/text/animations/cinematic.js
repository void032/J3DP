import anime from 'animejs';

export function cinematic(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }

  return anime({
    targets: el,
    translateY: dir === 'in' ? [50, 0] : [0, -40],
    opacity:    dir === 'in' ? [0, 1]  : [1, 0],
    letterSpacing: dir === 'in' ? ['0.25em', '0.03em'] : undefined,
    duration:   dir === 'in' ? 1200 : 600,
    easing:     dir === 'in' ? 'easeOutExpo' : 'easeInQuart',
    complete:   dir === 'out' ? () => { el.style.display = 'none'; } : undefined,
  });
}
