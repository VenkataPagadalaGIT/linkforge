// Procedural wireframe terrain mesh (SVG)
(function buildMesh() {
  const top = document.querySelector('.mesh-top');
  const floor = document.querySelector('.mesh-floor');
  if (!top || !floor) return;

  const COLS = 44;
  const ROWS = 34;
  const SPACING = 12;
  const TILT = 0.45;     // y-compression (camera angle)
  const PEAK = 130;      // max height of terrain bump
  const cx = 0;
  const cy = 0;

  // Height field: smooth domed surface with secondary ripple
  function height(u, v) {
    const dx = u - 0.5;
    const dy = v - 0.5;
    const r = Math.sqrt(dx*dx + dy*dy);
    const dome = Math.cos(Math.min(r * Math.PI * 1.4, Math.PI)) * 0.5 + 0.5;
    const ripple = Math.cos(r * 12) * 0.08 + Math.sin(u * 9) * 0.05 + Math.cos(v * 7) * 0.05;
    return Math.max(0, dome + ripple) * PEAK;
  }

  // Project a (gridX, gridZ, height) point into iso-ish 2D screen coords
  function project(gx, gz, h) {
    const x = (gx - (COLS - 1) / 2) * SPACING;
    const z = (gz - (ROWS - 1) / 2) * SPACING;
    return [cx + x, cy + z * TILT - h];
  }

  // Build the floor (flat plane below the mesh)
  const FLOOR_Y = 30;
  let floorPaths = '';
  for (let r = 0; r < ROWS; r++) {
    let d = '';
    for (let c = 0; c < COLS; c++) {
      const [x, y] = project(c, r, -FLOOR_Y);
      d += (c === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    floorPaths += `<path d="${d}"/>`;
  }
  for (let c = 0; c < COLS; c++) {
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      const [x, y] = project(c, r, -FLOOR_Y);
      d += (r === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    floorPaths += `<path d="${d}"/>`;
  }
  floor.innerHTML = floorPaths;

  // Build the terrain mesh top
  let topPaths = '';
  // horizontal lines (constant row)
  for (let r = 0; r < ROWS; r++) {
    let d = '';
    for (let c = 0; c < COLS; c++) {
      const h = height(c / (COLS - 1), r / (ROWS - 1));
      const [x, y] = project(c, r, h);
      d += (c === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    topPaths += `<path d="${d}"/>`;
  }
  // depth lines (constant column)
  for (let c = 0; c < COLS; c++) {
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      const h = height(c / (COLS - 1), r / (ROWS - 1));
      const [x, y] = project(c, r, h);
      d += (r === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    topPaths += `<path d="${d}"/>`;
  }
  top.innerHTML = topPaths;
})();

// Mobile nav toggle
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav-burger');
if (burger) {
  burger.addEventListener('click', () => nav.classList.toggle('is-open'));
}

// Subtle parallax on the 3D room shards while scrolling the hero
const room = document.querySelector('.room');
const shards = document.querySelectorAll('.shard');
if (room && shards.length) {
  window.addEventListener('scroll', () => {
    const y = Math.min(window.scrollY, 600);
    shards.forEach((s, i) => {
      const depth = ((i % 4) + 1) * 0.08;
      s.style.transform = `translate3d(0, ${y * depth * 0.4}px, 0)`;
    });
  }, { passive: true });
}

// Mouse-driven perspective tilt on the hero room
if (room) {
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    room.style.perspectiveOrigin = `${50 + x * 20}% ${50 + y * 20}%`;
  });
  hero.addEventListener('mouseleave', () => {
    room.style.perspectiveOrigin = '50% 50%';
  });
}

// Reveal-on-scroll for content sections (light, default-visible fallback)
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.pillar, .service, .blog-card, .benefit, .section-head').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});
