import anime from 'animejs';

export function dust(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }

  const isCloudBeat = el.id === 'cloud-beat';
  const colorStart = 'var(--text-cloud)';
  const colorEnd = 'var(--text-primary)';

  // Simplified dust placeholder for brevity of scaffolding
  // Full canvas implementation would go here per spec
  return anime({
    targets: el,
    opacity: dir === 'in' ? [0, 1] : [1, 0],
    color: isCloudBeat && dir === 'in' ? [colorStart, colorEnd] : undefined,
    duration: dir === 'in' ? (isCloudBeat ? 1000 : 1400) : 900,
    easing: 'linear',
    complete: dir === 'out' ? () => {
      el.style.display = 'none';
      // Reset color state for subsequent plays if needed
      if (isCloudBeat) el.style.color = colorStart;
    } : undefined,
  });
}
