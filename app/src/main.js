// Wires the editor: photos in, panels, layout, grade, caption, export. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCoverArt } from './cover.js';
import { LAYOUTS, panelAt } from './layouts.js';
import { SIZES, TITLE_STYLES, GRADES } from './grades.js';
import { runShot, SAMPLE_PHOTOS } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

/** A fresh editor state: nine panel slots, the first four filled from the samples. */
export function freshState() {
  return {
    layout: 'hero',
    size: 'square',
    grade: 'sunset',
    titleStyle: 'gradient',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'EST. 2026',
    grain: true,
    vignette: true,
    selected: 0,
    showSelection: true,
    photos: [],
    panels: Array.from({ length: 9 }, (_, i) => ({
      photo: i < 4 ? i : null, zoom: 1, ox: 0, oy: 0,
    })),
  };
}

export const state = freshState();
let undoStack = [];
let redoStack = [];

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The serializable part of the state (photos are Image objects, kept aside). */
function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify(rest);
}
function restore(json) {
  const data = JSON.parse(json);
  const photos = state.photos;
  Object.assign(state, data, { photos, showSelection: true });
}

/** Records the current state for undo, then clears the redo stack. */
export function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}
function syncUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncInputs();
  redraw();
  syncUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncInputs();
  redraw();
  syncUndoButtons();
}

/** Sizes the preview canvas to the chosen export size, capped at a 900px long side. */
function sizePreviewCanvas() {
  const { w, h } = SIZES[state.size];
  const scale = Math.min(1, 900 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
}

/** Repaints the preview. */
export function redraw() {
  drawCoverArt(canvas, state);
}

/** Builds a row of toggle chips from a map of key -> {label}. */
function buildChips(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [key, opt] of Object.entries(options)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.label;
    b.setAttribute('aria-pressed', String(key === current));
    b.addEventListener('click', () => {
      pushHistory();
      onPick(key);
      buildChips(el, options, key, onPick);
      redraw();
    });
    el.appendChild(b);
  }
}

function refreshChips() {
  buildChips($('layouts'), LAYOUTS, state.layout, (k) => { state.layout = k; });
  buildChips($('grades'), GRADES, state.grade, (k) => { state.grade = k; });
  buildChips($('titleStyles'), TITLE_STYLES, state.titleStyle, (k) => { state.titleStyle = k; });
  buildChips($('sizes'), SIZES, state.size, (k) => { state.size = k; sizePreviewCanvas(); });
}

/** Keeps the form inputs in sync with the state (after undo/redo or a shot scene). */
export function syncInputs() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('zoom').value = String(state.panels[state.selected]?.zoom ?? 1);
  sizePreviewCanvas();
  refreshChips();
  updatePanelTag();
}

/** Shows which panel is selected, above the preview. */
function updatePanelTag() {
  const tag = $('panelTag');
  tag.hidden = false;
  tag.textContent = `Panel ${state.selected + 1} of ${LAYOUTS[state.layout].panels}`;
}

/** Rebuilds the photo tray from the loaded photos. */
export function rebuildTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  if (!state.photos.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No photos yet — add yours, or tap a sample below.';
    tray.appendChild(p);
    return;
  }
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = `Photo ${i + 1}`;
    thumb.className = i < SAMPLE_PHOTOS.length ? 'sample' : '';
    if (state.panels[state.selected]?.photo === i) thumb.classList.add('selected');
    thumb.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected].photo = i;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      $('zoom').value = '1';
      rebuildTray();
      redraw();
    });
    tray.appendChild(thumb);
  });
}

/** Puts one photo in every panel, cycling through the loaded photos. */
function fillAllPanels() {
  if (!state.photos.length) return;
  pushHistory();
  const n = LAYOUTS[state.layout].panels;
  for (let i = 0; i < n; i++) {
    state.panels[i].photo = i % state.photos.length;
    state.panels[i].zoom = 1;
    state.panels[i].ox = 0;
    state.panels[i].oy = 0;
  }
  $('zoom').value = '1';
  rebuildTray();
  redraw();
}

/** Deals the loaded photos to the panels in a random order. */
function shufflePhotos() {
  if (!state.photos.length) return;
  pushHistory();
  const n = LAYOUTS[state.layout].panels;
  const order = [...state.photos.keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < n; i++) state.panels[i].photo = order[i % order.length];
  rebuildTray();
  redraw();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export async function exportCover(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCoverArt(off, { ...state, showSelection: false });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-cover-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return a.download;
}

function say(msg) {
  status.textContent = msg;
}

/** Waits until the vendored fonts can draw, so the first paint is already lettered. */
async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallbacks in the canvas font stacks still letter the cover.
  }
}

// --- Photo uploads ---------------------------------------------------------
$('upload').addEventListener('change', async (e) => {
  const files = [...(e.target.files || [])];
  if (!files.length) return;
  pushHistory();
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      state.photos.push(img);
    } catch {
      say(`Could not read ${file.name}.`);
    }
  }
  // New uploads go into the selected panel, then the next empty ones.
  let target = state.selected;
  for (let i = state.photos.length - files.length; i < state.photos.length; i++) {
    if (state.panels[target] && state.panels[target].photo == null) {
      state.panels[target].photo = i;
    }
    target += 1;
  }
  rebuildTray();
  redraw();
  say(`${files.length} photo${files.length > 1 ? 's' : ''} added — click a panel, then a photo, to place it.`);
  e.target.value = '';
});

// --- Caption inputs --------------------------------------------------------
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('title').addEventListener('change', pushHistory);
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('subtitle').addEventListener('change', pushHistory);
$('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
$('badge').addEventListener('change', pushHistory);
$('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('change', pushHistory);

// --- Panel picking and dragging --------------------------------------------
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (idx === -1) return;
  drag = { startX: p.x, startY: p.y, moved: false, panel: state.panels[idx] };
  if (state.selected !== idx) {
    state.selected = idx;
    $('zoom').value = String(state.panels[idx].zoom ?? 1);
    rebuildTray();
    updatePanelTag();
    redraw();
  }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.startX;
  const dy = p.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved || drag.panel.photo == null) return;
  const rects = LAYOUTS[state.layout].rects(canvas.width, canvas.height);
  const rect = rects[state.selected];
  drag.panel.ox = Math.max(-0.5, Math.min(0.5, (drag.panel.ox || 0) + dx / rect.w));
  drag.panel.oy = Math.max(-0.5, Math.min(0.5, (drag.panel.oy || 0) + dy / rect.h));
  drag.startX = p.x;
  drag.startY = p.y;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) pushHistory();
  drag = null;
});

// --- Buttons ---------------------------------------------------------------
$('fillAll').addEventListener('click', fillAllPanels);
$('shuffle').addEventListener('click', shufflePhotos);
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('reset').addEventListener('click', () => {
  pushHistory();
  const photos = state.photos;
  Object.assign(state, freshState(), { photos });
  syncInputs();
  rebuildTray();
  redraw();
  say('Reset to the default cover.');
});
$('exportOne').addEventListener('click', async () => {
  say('Exporting…');
  const name = await exportCover(state.size);
  say(`Saved ${name}`);
});
$('exportAll').addEventListener('click', async () => {
  say('Exporting all 3 sizes…');
  for (const key of Object.keys(SIZES)) {
    await exportCover(key);
    await new Promise((r) => setTimeout(r, 350));
  }
  say('Saved 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNGs.');
});

// --- Startup ---------------------------------------------------------------
async function start() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  await waitForFonts();
  sizePreviewCanvas();
  refreshChips();
  syncUndoButtons();
  if (shot) {
    await runShot(shot, params, { state, loadImage, redraw, rebuildTray, syncInputs, sizePreviewCanvas, exportCover });
  } else {
    // Load the four bundled samples so the first paint is already a cover.
    for (const name of SAMPLE_PHOTOS) {
      try {
        state.photos.push(await loadImage(`samples/${name}.jpg`));
      } catch {
        // A missing sample just leaves its panels empty.
      }
    }
    syncInputs();
    rebuildTray();
    redraw();
  }
}

start();
