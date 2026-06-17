import { cinematic } from './animations/cinematic.js';
import { float } from './animations/float.js';
import { dust } from './animations/dust.js';
import { typewriter } from './animations/typewriter.js';
import { reveal } from './animations/reveal.js';
import { glitch } from './animations/glitch.js';
import anime from 'animejs';

export function logoReveal(el, dir) {
  if (dir === 'in') {
    el.style.display = 'block';
  }
  return anime({
    targets: el,
    clipPath: dir === 'in' ? ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] : ['inset(0 0% 0 0)', 'inset(0 100% 0 0)'],
    duration: 1200 * (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.15 : 1),
    easing: 'easeOutQuart',
    complete: () => {
      if (dir === 'in') el.classList.add('logo-pulse');
      if (dir === 'out') {
        el.classList.remove('logo-pulse');
        el.style.display = 'none';
      }
    }
  });
}

const ANIMATIONS = { cinematic, float, dust, typewriter, reveal, glitch, logoReveal };

const TEXT_BEATS = [
  // Scene 1
  {
    id: 'hero-title',
    scrollIn: 0.00,
    scrollOut: 0.13,
    animation: 'cinematic',
    position: 'center',
    html: `
      <h1 class="text-hero" style="font-family: var(--font-display); font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">PROJECT NAME</h1>
      <p class="text-sub" style="color: var(--text-dim); transition-delay: 400ms;">Tagline that says what this is about</p>
    `
  },
  {
    id: 'hero-scroll-hint',
    scrollIn: 0.02,
    scrollOut: 0.15,
    animation: 'float',
    position: 'bottom-center',
    html: `
      <span class="text-label" style="color: var(--text-dim);">↓ scroll to fly through</span>
    `
  },
  // Scene 2
  {
    id: 'pass-beat-1',
    scrollIn: 0.22,
    scrollOut: 0.30,
    animation: 'cinematic',
    position: 'bottom-left',
    html: `
      <p class="text-label" style="color: var(--text-accent); letter-spacing: 0.2em; text-transform: uppercase;">ONE POOL</p>
      <h2 class="text-section" style="color: var(--text-primary); font-weight: 800;">Every Function</h2>
      <p class="text-body" style="color: var(--text-dim); max-width: 360px; transition-delay: 300ms;">Short supporting description line. One sentence max.</p>
    `
  },
  {
    id: 'pass-beat-2',
    scrollIn: 0.31,
    scrollOut: 0.37,
    animation: 'dust',
    position: 'right',
    html: `
      <h3 class="text-section" style="color: var(--text-accent); font-family: var(--font-mono);">SWAP.<br>LEND.<br>BORROW.</h3>
    `
  },
  // Scene 3
  {
    id: 'cloud-beat',
    scrollIn: 0.43,
    scrollOut: 0.53,
    animation: 'dust',
    position: 'center',
    html: `
      <h2 class="text-hero" style="font-family: var(--font-display); font-weight: 800; color: inherit;">WHERE LIQUIDITY FLOWS</h2>
    `
  },
  // Scene 4
  {
    id: 'forest-beat-a',
    scrollIn: 0.57,
    scrollOut: 0.63,
    animation: 'reveal',
    position: 'left',
    html: `
      <p class="text-label" style="color: var(--text-accent); letter-spacing: 0.2em;">FOR LPs</p>
      <h3 class="text-section" style="color: var(--text-primary); font-weight: 800;">Deposit One Asset</h3>
      <p class="text-body" style="color: var(--text-dim); max-width: 340px; transition-delay: 200ms;">Earn from swaps, borrowing, and internal arbitrage. Single-sided.</p>
    `
  },
  {
    id: 'forest-beat-b',
    scrollIn: 0.63,
    scrollOut: 0.69,
    animation: 'cinematic',
    position: 'right',
    html: `
      <div style="text-align: right;">
        <p class="text-label" style="color: var(--text-accent); letter-spacing: 0.2em;">FOR BORROWERS</p>
        <h3 class="text-section" style="color: var(--text-primary); font-weight: 800;">Access Capital</h3>
        <p class="text-body" style="color: var(--text-dim); max-width: 340px; transition-delay: 200ms; margin-left: auto;">Single-asset collateral. A model built for changing markets.</p>
      </div>
    `
  },
  {
    id: 'forest-beat-c',
    scrollIn: 0.69,
    scrollOut: 0.75,
    animation: 'typewriter',
    position: 'bottom-center',
    html: `
      <p class="text-label" style="color: var(--text-accent); letter-spacing: 0.2em;">FOR TRADERS</p>
      <h3 class="text-section" style="color: var(--text-primary); font-weight: 800;">Better Execution</h3>
      <p class="text-body" style="color: var(--text-dim); max-width: 500px; text-align: center; transition-delay: 200ms;">Direct swaps, cleaner routing, more efficient markets.</p>
    `
  },
  // Scene 5
  {
    id: 'descent-glitch',
    scrollIn: 0.77,
    scrollOut: 0.85,
    animation: 'glitch',
    position: 'center',
    html: `
      <h2 class="text-hero" style="color: var(--text-gold); font-family: var(--font-display); font-weight: 800;">ReDeFined</h2>
      <p class="text-sub" style="color: var(--text-dim); transition-delay: 900ms;">A new model for deeper, cleaner, more efficient liquidity.</p>
    `
  },
  {
    id: 'descent-sub',
    scrollIn: 0.84,
    scrollOut: 0.88,
    animation: 'reveal',
    position: 'bottom-right',
    html: `
      <p class="text-label" style="color: var(--text-dim); letter-spacing: 0.15em; text-align: right;">Building a more capital-efficient foundation</p>
    `
  },
  // Scene 6 (Footer)
  {
    id: 'footer-logo',
    scrollIn: 0.90,
    scrollOut: 'never',
    animation: 'logoReveal',
    position: 'center',
    html: `
      <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="fill: white;">
        <rect width="200" height="60" rx="4"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="24" fill="black">PROJECT LOGO</text>
      </svg>
    `
  },
  {
    id: 'footer-tagline',
    scrollIn: 0.91,
    scrollOut: 'never',
    animation: 'typewriter',
    position: 'bottom-center',
    style: 'bottom: 160px;',
    html: `
      <p class="text-label" style="color: var(--text-dim); letter-spacing: 0.25em; font-family: var(--font-mono);">STAY CLOSE TO THE SUMMIT</p>
    `
  },
  {
    id: 'footer-links',
    scrollIn: 0.93,
    scrollOut: 'never',
    animation: 'float',
    position: 'bottom-center',
    style: 'bottom: 80px;',
    html: `
      <div class="footer-links" style="display: flex; flex-direction: row; gap: 40px;">
        <a href="#" class="footer-link">↗ Telegram</a>
        <a href="#" class="footer-link">↗ Twitter</a>
      </div>
    `
  },
  {
    id: 'footer-copy',
    scrollIn: 0.96,
    scrollOut: 'never',
    animation: 'float',
    position: 'bottom-center',
    style: 'bottom: 24px;',
    html: `
      <p class="text-label" style="color: var(--text-dim);">© 2025 PROJECT NAME · All rights reserved</p>
    `
  }
];

export function createTextLayer(containerEl) {
  // Mount all beat elements
  const beats = TEXT_BEATS.map(config => {
    const el = document.createElement('div');
    el.className = `text-beat ${config.position}`;
    el.id = config.id;
    if (config.style) el.style.cssText += config.style;
    el.style.display = 'none'; // Hidden initially
    el.innerHTML = config.html;
    containerEl.appendChild(el);

    return { ...config, _visible: false, el };
  });

  function showBeat(beat) {
    const animFn = ANIMATIONS[beat.animation];
    if (animFn) {
      animFn(beat.el, 'in');
    } else {
      beat.el.style.display = 'block';
    }
  }

  function hideBeat(beat) {
    const animFn = ANIMATIONS[beat.animation];
    if (animFn) {
      animFn(beat.el, 'out');
    } else {
      beat.el.style.display = 'none';
    }
  }

  function update(progress) {
    for (const beat of beats) {
      const shouldBeVisible =
        progress >= beat.scrollIn &&
        (beat.scrollOut === 'never' || progress < beat.scrollOut);

      if (shouldBeVisible && !beat._visible) {
        beat._visible = true;
        showBeat(beat);
      } else if (!shouldBeVisible && beat._visible) {
        beat._visible = false;
        hideBeat(beat);
      }
    }
  }

  return { update };
}
