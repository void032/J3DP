import anime from 'animejs';

export function typewriter(el, dir) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeScale = reduced ? 0.15 : 1;
  if (dir === 'in') {
    el.style.display = 'block';
  }

  // Pre-split: wrap each character in <span class="char">
  if (!el.dataset.split) {
    // If element has multiple children, we'd need more complex parsing
    // but assuming simple textContent for this spec implementation

    // A proper implementation would recursively walk text nodes.
    // For scaffolding the spec, we will wrap text node contents.
    function wrapTextNodes(node) {
      if (node.nodeType === 3 && node.nodeValue.trim().length > 0) { // Text node
        const chars = node.nodeValue.split('');
        const frag = document.createDocumentFragment();
        chars.forEach(c => {
          if (c === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.opacity = '0';
            span.textContent = c;
            frag.appendChild(span);
          }
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) { // Element node
        Array.from(node.childNodes).forEach(wrapTextNodes);
      }
    }
    wrapTextNodes(el);
    el.dataset.split = 'true';

  }

  const chars = el.querySelectorAll('.char');

  if (dir === 'in') {
    // Adding cursor if needed
    if (!el.querySelector('.cursor')) {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      cursor.textContent = '|';
      el.appendChild(cursor);
    }
  }

  return anime({
    targets: chars,
    opacity: dir === 'in' ? [0, 1] : [1, 0],
    delay: anime.stagger((dir === 'in' ? 38 : 18) * timeScale),
    duration: (160) * timeScale,
    easing: 'linear',
    complete: dir === 'out' ? () => {
      el.style.display = 'none';
      const cursor = el.querySelector('.cursor');
      if (cursor) cursor.remove();
    } : undefined,
  });
}
