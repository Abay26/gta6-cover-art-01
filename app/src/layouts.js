// Panel geometry for the four cover layouts. Every layout is a function of the cover's
// pixel size that returns its panels as rectangles (x, y, w, h, rotation in radians),
// plus where the title block sits. Coordinates are in pixels; gutters stay proportional.

/** The gutter between panels, as a fraction of the cover's short side. */
export const GUTTER = 0.012;

/** All layouts, in the order the editor offers them. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + 3',
    panels: 4,
    blurb: 'One big hero panel, three stacked beside it',
    rects(w, h) {
      const g = Math.round(Math.min(w, h) * GUTTER);
      const heroW = Math.round(w * 0.62);
      const sideX = heroW + g;
      const sideW = w - sideX;
      const sideH = Math.round((h - 2 * g) / 3);
      return [
        { x: 0, y: 0, w: heroW, h, rot: 0 },
        { x: sideX, y: 0, w: sideW, h: sideH, rot: 0 },
        { x: sideX, y: sideH + g, w: sideW, h: sideH, rot: 0 },
        { x: sideX, y: 2 * (sideH + g), w: sideW, h: sideH, rot: 0 },
      ];
    },
  },
  nine: {
    label: 'Nine Panel',
    panels: 9,
    blurb: 'The classic 3 x 3 poster grid',
    rects(w, h) {
      const g = Math.round(Math.min(w, h) * GUTTER);
      const cw = Math.round((w - 2 * g) / 3);
      const ch = Math.round((h - 2 * g) / 3);
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0 });
        }
      }
      return out;
    },
  },
  tilt: {
    label: 'Tilted Snaps',
    panels: 3,
    blurb: 'Three tilted snapshots on a sunset sky',
    rects(w, h) {
      const pw = Math.round(w * 0.36);
      const ph = Math.round(h * 0.5);
      const cy = Math.round(h * 0.23);
      return [
        { x: Math.round(w * 0.05), y: cy, w: pw, h: ph, rot: -0.1 },
        { x: Math.round(w * 0.32), y: cy + Math.round(h * 0.05), w: pw, h: ph, rot: 0.02 },
        { x: Math.round(w * 0.59), y: cy, w: pw, h: ph, rot: 0.09 },
      ];
    },
  },
  bleed: {
    label: 'Full Bleed',
    panels: 1,
    blurb: 'One photo edge to edge, title over it',
    rects(w, h) {
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    },
  },
};

/** Panels for a layout at a given cover size. */
export function layoutPanels(layout, w, h) {
  return LAYOUTS[layout].rects(w, h);
}

/** Which panel (index) contains point (px, py), or -1. Tilted panels test their rotated box. */
export function panelAt(layout, w, h, px, py) {
  const rects = layoutPanels(layout, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(-r.rot);
    const sin = Math.sin(-r.rot);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return -1;
}
