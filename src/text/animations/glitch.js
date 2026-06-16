import anime from 'animejs';

export function glitch(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }

  if (dir === 'out') {
    return anime({
      targets: el,
      opacity: [1, 0],
      duration: 500,
      easing: 'easeInQuart',
      complete: () => { el.style.display = 'none'; }
    });
  }

  // IN: 3 jitter cycles using CSS class, then settle
  el.style.opacity = 1;

  // If it has complex HTML, the simple CSS pseudo-element approach in the spec is flawed.
  // We'll set the dataset text for the basic case, but real implementation needs canvas or multiple DOM layers.
  el.dataset.text = el.innerText || el.textContent;


  let count = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      el.classList.toggle('glitch-active');
      count++;
      if (count >= 6) {
        clearInterval(interval);
        el.classList.remove('glitch-active');
        resolve(); // resolve promise when done
      }
    }, 120);
  });
}
