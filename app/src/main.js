// Editor wiring for Vice Grid: state, controls, drag-to-pan and export.
//
// The page holds one `state` object (see cover.js for its shape). Every
// control edits the state and re-renders the preview, so what the maker
// sees is exactly what an export will write. Photos are read from the
// maker's own machine with URL.createObjectURL and never leave it.

import { LAYOUTS, layoutById, panelRects } from './layout.js';
import { GRADES } from './grades.js';
import { SUN_POSITIONS } from './backdrop.js';
import { LETTERING_STYLES, titleFontReady } from './lettering.js';
import { EXPORT_SIZES, emptyPanel, exportCoverPng, renderCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelControls = document.getElementById('panel-controls');

const state = {
  layout: 'hero-duo',
  panels: [emptyPanel(), emptyPanel(), emptyPanel(), emptyPanel()],
  onePhoto: false,
  caption: 'Sunset Heist',
  lettering: 'chrome',
  captionSize: 1,
  captionSpacing: 0.012,
  captionPos: 'bottom',
  grade: 'sunset',
  vice: true,
  viceSun: 1,
  vicePos: 'center',
  vignette: true,
  grain: true,
  gap: 0.012,
  radius: 0.014,
  border: 0,
  borderColour: 'rgba(255, 255, 255, 0.85)',
  backdrop: '#140a24',
};

let exportSize = EXPORT_SIZES[0];
let selectedPanel = 0;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Re-renders the preview at the current export size. */
function redraw() {
  if (canvas.width !== exportSize.w || canvas.height !== exportSize.h) {
    canvas.width = exportSize.w;
    canvas.height = exportSize.h;
  }
  renderCover(canvas, state);
}

function say(message) {
  status.textContent = message;
}

/** Builds the per-panel photo pickers for the current layout. */
function buildPanelControls() {
  panelControls.replaceChildren();
  const count = layoutById(state.layout).panels;
  for (let i = 0; i < count; i += 1) {
    const wrap = document.createElement('div');
    wrap.className = 'panel-control' + (i === selectedPanel ? ' selected' : '');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'panel-head';
    head.textContent = `Panel ${i + 1}`;
    head.addEventListener('click', () => {
      selectedPanel = i;
      buildPanelControls();
      syncZoom();
    });

    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    file.addEventListener('change', async () => {
      const picked = file.files[0];
      if (!picked) return;
      state.panels[i].photo = await loadImage(URL.createObjectURL(picked));
      selectedPanel = i;
      buildPanelControls();
      syncZoom();
      redraw();
      say(`Panel ${i + 1} photo loaded. Drag on the cover to position it.`);
    });

    const sample = document.createElement('button');
    sample.type = 'button';
    sample.className = 'mini';
    sample.textContent = 'Use a sample';
    sample.addEventListener('click', async () => {
      const name = i % 2 === 0 ? 'pier' : 'boulevard';
      state.panels[i].photo = await loadImage(`samples/${name}.jpg`);
      selectedPanel = i;
      buildPanelControls();
      syncZoom();
      redraw();
    });

    wrap.append(head, file, sample);
    panelControls.append(wrap);
  }
}

const zoomInput = document.getElementById('zoom');

/** Shows the selected panel's zoom in the slider. */
function syncZoom() {
  zoomInput.value = String(state.panels[selectedPanel]?.zoom ?? 1);
}

/** Fills a <select> with {id, name} options and selects the current value. */
function fillSelect(id, options, current) {
  const select = document.getElementById(id);
  select.replaceChildren();
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option.id;
    el.textContent = option.name;
    select.append(el);
  }
  select.value = current;
  return select;
}

function wireControls() {
  fillSelect('layout', LAYOUTS, state.layout).addEventListener('change', (e) => {
    state.layout = e.target.value;
    selectedPanel = 0;
    buildPanelControls();
    syncZoom();
    redraw();
  });

  fillSelect('grade', GRADES, state.grade).addEventListener('change', (e) => {
    state.grade = e.target.value;
    redraw();
  });

  document.getElementById('vice').addEventListener('change', (e) => {
    state.vice = e.target.checked;
    redraw();
    say(state.vice
      ? 'Vice backdrop on — retro sun and palms over the cover.'
      : 'Vice backdrop off — photos and grade only.');
  });

  document.getElementById('vice-sun').addEventListener('input', (e) => {
    state.viceSun = Number(e.target.value);
    redraw();
  });

  fillSelect('vice-pos', SUN_POSITIONS, state.vicePos).addEventListener('change', (e) => {
    state.vicePos = e.target.value;
    redraw();
  });

  fillSelect('lettering', LETTERING_STYLES, state.lettering).addEventListener('change', (e) => {
    state.lettering = e.target.value;
    redraw();
  });

  fillSelect('size', EXPORT_SIZES, exportSize.id).addEventListener('change', (e) => {
    exportSize = EXPORT_SIZES.find((s) => s.id === e.target.value) ?? EXPORT_SIZES[0];
    redraw();
  });

  const caption = document.getElementById('caption');
  caption.addEventListener('input', () => {
    state.caption = caption.value;
    redraw();
  });

  document.getElementById('caption-size').addEventListener('input', (e) => {
    state.captionSize = Number(e.target.value);
    redraw();
  });

  document.getElementById('caption-spacing').addEventListener('input', (e) => {
    state.captionSpacing = Number(e.target.value);
    redraw();
  });

  document.getElementById('caption-pos').addEventListener('change', (e) => {
    state.captionPos = e.target.value;
    redraw();
  });

  document.getElementById('one-photo').addEventListener('change', (e) => {
    state.onePhoto = e.target.checked;
    redraw();
    say(state.onePhoto
      ? 'One photo now fills every panel (set it on Panel 1).'
      : 'Each panel uses its own photo again.');
  });

  zoomInput.addEventListener('input', () => {
    const panel = state.panels[selectedPanel];
    if (panel) panel.zoom = Number(zoomInput.value);
    redraw();
  });

  document.getElementById('gap').addEventListener('input', (e) => {
    state.gap = Number(e.target.value);
    redraw();
  });

  document.getElementById('radius').addEventListener('input', (e) => {
    state.radius = Number(e.target.value);
    redraw();
  });

  document.getElementById('border').addEventListener('input', (e) => {
    state.border = Number(e.target.value);
    redraw();
  });

  document.getElementById('backdrop').addEventListener('input', (e) => {
    state.backdrop = e.target.value;
    redraw();
  });

  document.getElementById('vignette').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    redraw();
  });

  document.getElementById('grain').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    redraw();
  });

  for (const size of EXPORT_SIZES) {
    document.getElementById(`export-${size.id}`).addEventListener('click', async () => {
      const blob = await exportCoverPng(state, size.w, size.h);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-grid-${size.w}x${size.h}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      say(`Saved vice-grid-${size.w}x${size.h}.png`);
    });
  }
}

/** Which panel is under a point, in canvas pixel coordinates. */
function panelAt(px, py) {
  const rects = panelRects(state.layout, state.gap);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px >= r.x * canvas.width && px <= (r.x + r.w) * canvas.width
      && py >= r.y * canvas.height && py <= (r.y + r.h) * canvas.height) {
      return i;
    }
  }
  return selectedPanel;
}

/** Dragging on the preview pans the photo inside the grabbed panel. */
function wireDrag() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const box = canvas.getBoundingClientRect();
    const px = (e.clientX - box.left) * (canvas.width / box.width);
    const py = (e.clientY - box.top) * (canvas.height / box.height);
    selectedPanel = panelAt(px, py);
    const panel = state.panels[selectedPanel];
    drag = {
      x: e.clientX,
      y: e.clientY,
      panX: panel?.panX ?? 0,
      panY: panel?.panY ?? 0,
      scaleX: canvas.width / box.width,
      scaleY: canvas.height / box.height,
    };
    canvas.setPointerCapture(e.pointerId);
    buildPanelControls();
    syncZoom();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.panX = drag.panX + ((e.clientX - drag.x) * drag.scaleX) / canvas.width;
    panel.panY = drag.panY + ((e.clientY - drag.y) * drag.scaleY) / canvas.height;
    redraw();
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

/** Loads the two kit samples into the first panels for an instant cover. */
async function loadDefaultSamples() {
  const [pier, boulevard] = await Promise.all([
    loadImage('samples/pier.jpg'),
    loadImage('samples/boulevard.jpg'),
  ]);
  const order = [pier, boulevard, pier, boulevard];
  order.forEach((img, i) => { state.panels[i].photo = img; });
}

/** Applies a screenshot scene: samples into panels, state set, rendered. */
async function applyShotScene(scene) {
  exportSize = EXPORT_SIZES.find((s) => s.w === scene.size.w && s.h === scene.size.h)
    ?? { id: 'shot', name: 'Shot', w: scene.size.w, h: scene.size.h };
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.lettering = scene.lettering;
  state.caption = scene.caption;
  state.captionPos = scene.captionPos;
  state.vice = scene.vice;
  state.viceSun = scene.viceSun;
  state.vicePos = scene.vicePos;
  document.getElementById('caption').value = scene.caption;
  document.getElementById('layout').value = scene.layout;
  document.getElementById('grade').value = scene.grade;
  document.getElementById('lettering').value = scene.lettering;
  document.getElementById('caption-pos').value = scene.captionPos;
  document.getElementById('vice').checked = scene.vice;
  document.getElementById('vice-sun').value = String(scene.viceSun);
  document.getElementById('vice-pos').value = scene.vicePos;
  const images = await Promise.all(scene.photos.map((name) => loadImage(`samples/${name}.jpg`)));
  images.forEach((img, i) => { state.panels[i].photo = img; });
  // Per-panel framing: centre each crop's focus point in its panel. Pan
  // is in panel-size units (cover.js clamps it so the photo still
  // covers the panel), derived from the cover-fit geometry.
  const rects = panelRects(scene.layout, state.gap);
  (scene.crops ?? []).forEach((crop, i) => {
    const panel = state.panels[i];
    const img = panel?.photo;
    if (!panel || !img || !crop || !rects[i]) return;
    const rw = rects[i].w * exportSize.w;
    const rh = rects[i].h * exportSize.h;
    const base = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
    panel.zoom = crop.zoom;
    panel.panX = (0.5 - crop.fx) * (img.naturalWidth * base * crop.zoom) / rw;
    panel.panY = (0.5 - crop.fy) * (img.naturalHeight * base * crop.zoom) / rh;
  });
  buildPanelControls();
  redraw();
}

async function start() {
  wireControls();
  wireDrag();
  buildPanelControls();
  syncZoom();
  await titleFontReady();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, applyShotScene);
  } else {
    await loadDefaultSamples();
    redraw();
    say('Samples loaded — swap in your own photos, drag to position, then export.');
  }
}

start();
