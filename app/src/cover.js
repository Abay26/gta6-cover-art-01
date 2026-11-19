// The cover renderer: paints a whole cover onto a canvas at the canvas's own pixel
// size, from the editor state — panels, photos, grade, title block, grain, vignette.
// Everything is drawn with the 2D canvas API; no image leaves the machine.
import { layoutPanels } from './layouts.js';
import { GRADES, gradeOverlayGradient } from './grades.js';

const TITLE_GRADIENT = ['#ffd319', '#ff2975', '#8c1eff'];
const BACKDROP = '#160a24';

/** Clamps v into [lo, hi]. */
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Shrinks `font(px)` until `text` fits `maxWidth`, and returns the chosen px size. */
function fitFontSize(ctx, text, startPx, maxWidth, font) {
  let px = startPx;
  ctx.font = font(px);
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

let noisePattern = null;
/** A small tiled noise canvas, made once, for the film grain. */
function grainPattern(ctx) {
  if (noisePattern) return noisePattern;
  const n = document.createElement('canvas');
  n.width = 128;
  n.height = 128;
  const c = n.getContext('2d');
  const data = c.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 110);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  noisePattern = ctx.createPattern(n, 'repeat');
  return noisePattern;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPhotoIntoPanel(ctx, img, rect, panel, filter) {
  const { x: rx, y: ry, w: rw, h: rh } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.filter = filter;
  const base = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * (panel.zoom || 1);
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  let dx = rx + (rw - dw) / 2 + (panel.ox || 0) * rw;
  let dy = ry + (rh - dh) / 2 + (panel.oy || 0) * rh;
  if (dw > rw) dx = clamp(dx, rx + rw - dw, rx);
  if (dh > rh) dy = clamp(dy, ry + rh - dh, ry);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** Draws an empty panel: a dark gradient with a plus mark, inviting a photo. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#2b1745');
  g.addColorStop(1, '#170b26');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(245, 238, 252, 0.5)';
  ctx.font = `${Math.round(Math.min(rect.w, rect.h) * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/** The retro striped sun the tilted layout paints behind its snapshots. */
function drawRetroSun(ctx, w, h, grade) {
  const cx = w * 0.5;
  const cy = h * 0.105;
  const r = Math.min(w, h) * 0.14;
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sun.addColorStop(0, '#ffe95e');
  sun.addColorStop(0.55, '#ff9a3d');
  sun.addColorStop(1, '#ff2975');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.sky[0];
  for (let i = 0; i < 5; i++) {
    const y = cy + r * (0.05 + i * 0.18);
    ctx.fillRect(cx - r, y, r * 2, r * (0.02 + i * 0.012));
  }
  ctx.restore();
}

/** The title block: Anton title, Pacifico subtitle, halftone dots, across the foot. */
function drawTitleBlock(ctx, state, w, h) {
  const bandH = h * 0.19;
  const bandY = h - bandH;
  const shade = ctx.createLinearGradient(0, bandY - h * 0.12, 0, h);
  shade.addColorStop(0, 'rgba(12, 4, 22, 0)');
  shade.addColorStop(0.45, 'rgba(12, 4, 22, 0.72)');
  shade.addColorStop(1, 'rgba(12, 4, 22, 0.92)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY - h * 0.12, w, bandH + h * 0.12);

  // Halftone dots fading up behind the title.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  const dotGap = Math.max(10, w * 0.012);
  for (let row = 0; row < 3; row++) {
    const y = bandY + h * 0.02 + row * dotGap;
    const r = Math.max(1.5, dotGap * (0.32 - row * 0.08));
    for (let x = dotGap / 2; x < w; x += dotGap) {
      ctx.beginPath();
      ctx.arc(x + (row % 2 ? dotGap / 2 : 0), y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const margin = w * 0.045;
  const title = (state.title || 'NEON COAST').trim().toUpperCase() || 'NEON COAST';
  const titlePx = fitFontSize(
    ctx, title, h * 0.105, w - margin * 2,
    (px) => `400 ${px}px Anton, 'Arial Narrow', sans-serif`,
  );
  const titleY = h - h * 0.075;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (state.titleStyle === 'gradient') {
    const tg = ctx.createLinearGradient(margin, 0, margin + ctx.measureText(title).width, 0);
    tg.addColorStop(0, TITLE_GRADIENT[0]);
    tg.addColorStop(0.5, TITLE_GRADIENT[1]);
    tg.addColorStop(1, TITLE_GRADIENT[2]);
    ctx.fillStyle = tg;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = titlePx * 0.12;
    ctx.fillText(title, margin, titleY);
    ctx.shadowBlur = 0;
  } else if (state.titleStyle === 'outline') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, titlePx * 0.045);
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff2975';
    ctx.shadowBlur = titlePx * 0.35;
    ctx.strokeText(title, margin, titleY);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = titlePx * 0.15;
    ctx.fillText(title, margin, titleY);
    ctx.shadowBlur = 0;
  }

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subPx = Math.max(16, h * 0.038);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = '#ff7ec2';
    ctx.shadowColor = '#ff2975';
    ctx.shadowBlur = subPx * 0.8;
    ctx.fillText(subtitle, margin, titleY - titlePx * 0.98);
    ctx.shadowBlur = 0;
  }
}

/** The badge ribbon pinned to the cover's top-right corner. */
function drawBadgeRibbon(ctx, state, w, h) {
  const text = (state.badge || '').trim().toUpperCase();
  if (!text) return;
  const px = Math.max(14, h * 0.024);
  ctx.font = `400 ${px}px Anton, 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(`★ ${text} ★`).width;
  const padX = px * 0.9;
  const padY = px * 0.45;
  const bw = tw + padX * 2;
  const bh = px + padY * 2;
  const bx = w - bw - w * 0.03;
  const by = h * 0.03;
  ctx.fillStyle = 'rgba(12, 4, 22, 0.82)';
  ctx.strokeStyle = '#ffd319';
  ctx.lineWidth = Math.max(1.5, px * 0.08);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd319';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`★ ${text} ★`, bx + bw / 2, by + bh / 2 + px * 0.04);
  ctx.textBaseline = 'alphabetic';
}

/** Paints the whole cover from `state` onto `canvas` at its own pixel size. */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutPanels(state.layout, w, h);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, w, h);

  if (state.layout === 'tilt') {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    drawRetroSun(ctx, w, h, grade);
  }

  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    const img = panel.photo != null ? state.photos[panel.photo] : null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    if (state.layout === 'tilt') {
      // Polaroid frame: white border, thicker at the foot, soft shadow.
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = Math.round(w * 0.02);
      ctx.shadowOffsetY = Math.round(h * 0.012);
      ctx.fillStyle = '#fdf8ef';
      ctx.fillRect(-rect.w * 0.03, -rect.h * 0.03, rect.w * 1.06, rect.h * 1.1);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    const inner = state.layout === 'tilt'
      ? { x: 0, y: 0, w: rect.w, h: rect.h * 0.94 }
      : { x: 0, y: 0, w: rect.w, h: rect.h };
    if (img) drawPhotoIntoPanel(ctx, img, inner, panel, grade.filter);
    else drawEmptyPanel(ctx, inner);
    ctx.restore();

    // Selected-panel outline in the editor preview (never on exports).
    if (state.selected === i && state.showSelection) {
      ctx.save();
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.setLineDash([w * 0.02, w * 0.01]);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.restore();
    }
  });

  // The grade wash over the whole cover.
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = gradeOverlayGradient(ctx, grade, w, h);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  drawTitleBlock(ctx, state, w, h);
  drawBadgeRibbon(ctx, state, w, h);

  if (state.vignette) {
    const v = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
