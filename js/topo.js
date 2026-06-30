// ═══════════════════════════════════════════════════════════
// topo.js — Topografische contourlijnen generator
// Het signature visuele element van Travel Cockpit.
// ═══════════════════════════════════════════════════════════

function seededRandom(seed) {
  let x = seed;
  return function () {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function generateTopoLines(seed) {
  const rand = seededRandom(seed);
  let svg = '';
  for (let i = 0; i < 7; i++) {
    const cx = 200 + (rand() - 0.5) * 80;
    const cy = 150 + (rand() - 0.5) * 50;
    const rx = (40 + i * 32) * 1.45;
    const ry = 40 + i * 32;
    const isAccent = i === 2;
    const stroke = isAccent ? '#C5512B' : '#E8E4D9';
    const strokeWidth = isAccent ? 1.6 : 0.8;
    const opacity = isAccent ? 0.55 : 0.85 - i * 0.1;
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
  }
  return svg;
}

function initAllTopoPanels() {
  const panels = document.querySelectorAll('[data-topo]');
  panels.forEach((el, i) => {
    const seed = parseInt(el.dataset.topo) || i * 7 + 3;
    el.innerHTML = generateTopoLines(seed);
  });
}
