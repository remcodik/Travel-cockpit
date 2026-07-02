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

// elevationM (optioneel): reële hoogte van de plek in meters. Hoger =
// meer en dichter opeengepakte contourringen (steiler ogend terrein),
// lager = wijdere ringen (vlakker/kust ogend terrein) — zo krijgt elke
// accommodatie een visueel eigen, aan de echte locatie gekoppeld patroon
// i.p.v. voor elke plek exact dezelfde decoratieve lijnen.
function generateTopoLines(seed, elevationM) {
  const rand = seededRandom(seed);
  const ringCount = elevationM > 800 ? 9 : elevationM > 300 ? 7 : 5;
  const spacing = elevationM > 800 ? 24 : elevationM > 300 ? 32 : 40;
  let svg = '';
  for (let i = 0; i < ringCount; i++) {
    const cx = 200 + (rand() - 0.5) * 80;
    const cy = 150 + (rand() - 0.5) * 50;
    const rx = (40 + i * spacing) * 1.45;
    const ry = 40 + i * spacing;
    const isAccent = i === Math.floor(ringCount / 3);
    const stroke = isAccent ? '#C5512B' : '#E8E4D9';
    const strokeWidth = isAccent ? 1.6 : 0.8;
    const opacity = isAccent ? 0.55 : 0.85 - i * (0.7 / ringCount);
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
  }
  return svg;
}

// Seed afgeleid van echte coördinaten (+ evt. elevation) i.p.v. een vast
// getal — zelfde plek geeft altijd hetzelfde patroon, andere plek altijd
// een ander patroon.
function topoSeedForLocation(lat, lng, elevationM) {
  return Math.round(Math.abs(lat || 0) * 977 + Math.abs(lng || 0) * 613 + (elevationM || 0));
}

function initAllTopoPanels() {
  const panels = document.querySelectorAll('[data-topo]');
  panels.forEach((el, i) => {
    const seed = parseInt(el.dataset.topo) || i * 7 + 3;
    const elevation = el.dataset.topoElevation ? parseFloat(el.dataset.topoElevation) : undefined;
    el.innerHTML = generateTopoLines(seed, elevation);
  });
}
