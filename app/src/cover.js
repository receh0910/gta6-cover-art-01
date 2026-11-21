// The cover renderer: turns the editor state into a finished poster.
//
// renderCover draws at whatever pixel size the canvas has, so the live
// preview and the three export sizes share one code path. A panel state is
// { photo, zoom, panX, panY }: the photo is cover-fitted into its panel,
// then scaled by zoom and shifted by pan (fractions of the panel size).

import { panelRects } from './layout.js';
import { gradeLook, paintGradeLayers, paintVignette, paintGrain } from './grades.js';
import { paintViceBackdrop } from './backdrop.js';
import { drawTitle, fitTitleSize } from './lettering.js';

/** The post sizes the app exports, in menu order. */
export const EXPORT_SIZES = [
  { id: 'landscape', name: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
];

/** A fresh panel state: no photo yet, centred, no extra zoom. */
export function emptyPanel() {
  return { photo: null, zoom: 1, panX: 0, panY: 0 };
}

/** Rounds a rectangle path (panel corners) on the context. */
function roundedRectPath(ctx, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draws one photo cover-fitted into a panel rect, honouring the panel's
 * zoom and pan. Pan is clamped so the photo always covers the panel.
 */
function drawPanelPhoto(ctx, photo, rect, panel, filter) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  if (!iw || !ih) return;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * Math.max(1, panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const maxPanX = Math.max(0, (dw - rect.w) / 2);
  const maxPanY = Math.max(0, (dh - rect.h) / 2);
  const panX = Math.max(-maxPanX, Math.min(maxPanX, (panel.panX || 0) * rect.w));
  const panY = Math.max(-maxPanY, Math.min(maxPanY, (panel.panY || 0) * rect.h));
  const dx = rect.x + (rect.w - dw) / 2 + panX;
  const dy = rect.y + (rect.h - dh) / 2 + panY;
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** A quiet placeholder for a panel with no photo yet. */
function drawEmptyPanel(ctx, rect, index) {
  const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  shade.addColorStop(0, '#3a2358');
  shade.addColorStop(1, '#1c1030');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `${Math.max(14, rect.h * 0.07)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Panel ${index + 1} — add a photo`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/**
 * Renders the whole cover for `state` onto `canvas` at the canvas's own
 * size. Used for the live preview and, on an offscreen canvas, for export.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const look = gradeLook(state.grade);

  // Backdrop behind the panel grid.
  ctx.fillStyle = state.backdrop || '#140a24';
  ctx.fillRect(0, 0, W, H);

  const gapPx = (state.gap ?? 0.012) * Math.min(W, H);
  const rects = panelRects(state.layout, gapPx / Math.min(W, H)).map((r) => ({
    x: r.x * W,
    y: r.y * H,
    w: r.w * W,
    h: r.h * H,
  }));
  const radius = (state.radius ?? 0.012) * Math.min(W, H);

  rects.forEach((rect, index) => {
    const panel = state.panels[index] ?? emptyPanel();
    const photo = state.onePhoto ? (state.panels[0]?.photo ?? null) : panel.photo;
    ctx.save();
    roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.clip();
    if (photo) drawPanelPhoto(ctx, photo, rect, panel, look.filter);
    else drawEmptyPanel(ctx, rect, index);
    ctx.restore();

    if (state.border > 0) {
      ctx.save();
      roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
      ctx.strokeStyle = state.borderColour || 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = state.border * Math.min(W, H) * 0.004 + 1;
      ctx.stroke();
      ctx.restore();
    }
  });

  // Grade light layers, vignette and grain unify the panels into one poster.
  paintGradeLayers(ctx, W, H, look);
  // The Vice backdrop (retro sun + palms) sits in the grade's light,
  // under the vignette, grain and title.
  if (state.vice) {
    paintViceBackdrop(ctx, W, H, {
      sunSize: state.viceSun ?? 1,
      sunPos: state.vicePos ?? 'center',
    });
  }
  if (state.vignette) paintVignette(ctx, 0, 0, W, H, look.vignette);
  if (state.grain) paintGrain(ctx, 0, 0, W, H, look.grain ?? 0.1);

  // The title band.
  const caption = (state.caption ?? '').trim();
  if (caption) {
    const wanted = H * 0.16 * (state.captionSize ?? 1);
    const spacing = (state.captionSpacing ?? 0.01) * H;
    const size = fitTitleSize(ctx, caption.toUpperCase(), wanted, W * 0.92, spacing);
    const atTop = state.captionPos === 'top';
    const baseline = atTop ? size + H * 0.045 : H - H * 0.055;
    // A soft scrim behind the words keeps them readable over bright photos.
    const scrimH = size * 1.7;
    const scrimY = atTop ? 0 : H - scrimH;
    const scrim = ctx.createLinearGradient(0, scrimY, 0, scrimY + scrimH);
    if (atTop) {
      scrim.addColorStop(0, 'rgba(8, 2, 18, 0.55)');
      scrim.addColorStop(1, 'rgba(8, 2, 18, 0)');
    } else {
      scrim.addColorStop(0, 'rgba(8, 2, 18, 0)');
      scrim.addColorStop(1, 'rgba(8, 2, 18, 0.55)');
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, scrimY, W, scrimH);
    drawTitle(ctx, caption, W / 2, baseline, size, state.lettering, spacing);
  }
}

/**
 * Renders the cover at an exact export size on an offscreen canvas and
 * resolves to a PNG blob ready to download.
 */
export function exportCoverPng(state, width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  renderCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}
