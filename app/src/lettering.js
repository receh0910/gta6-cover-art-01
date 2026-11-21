// Caption lettering: the big poster title drawn over the cover.
//
// The title is set in Anton (a bold display face shipped under the SIL
// Open Font License, see fonts/OFL.txt) and painted in one of three
// styles. Every style auto-fits the words to the cover's width so a long
// caption never spills off the edge.

/** The lettering styles the editor offers, in menu order. */
export const LETTERING_STYLES = [
  { id: 'chrome', name: 'Sunset Chrome' },
  { id: 'neon', name: 'Neon Outline' },
  { id: 'block', name: 'Bold Block' },
];

/** The font family name declared in style.css for the vendored Anton face. */
export const TITLE_FONT = 'Anton';

/**
 * Waits until the title font is ready to draw with, so the first render
 * (and every screenshot) already uses the real letterforms.
 */
export async function titleFontReady() {
  try {
    await document.fonts.load(`100px ${TITLE_FONT}`);
    await document.fonts.ready;
  } catch {
    // A browser without the Font Loading API still draws with the fallback.
  }
}

/** Measures a caption at a size, honouring letter-spacing when supported. */
function measure(ctx, text, size, spacing) {
  ctx.font = `${size}px ${TITLE_FONT}, 'Arial Black', sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  return ctx.measureText(text).width;
}

/**
 * Picks the largest font size (up to `wanted`) whose caption fits `maxWidth`.
 * Returns the size to draw at.
 */
export function fitTitleSize(ctx, text, wanted, maxWidth, spacing) {
  let size = Math.max(10, wanted);
  while (size > 10 && measure(ctx, text, size, spacing) > maxWidth) {
    size -= Math.max(1, Math.floor(size * 0.04));
  }
  return size;
}

/**
 * Draws the caption centred at (cx, baselineY) in the chosen style.
 * `size` is the fitted font size; the caller decides where the band sits.
 */
export function drawTitle(ctx, text, cx, baselineY, size, styleId, spacing) {
  const words = text.trim().toUpperCase();
  if (!words) return;
  ctx.save();
  ctx.font = `${size}px ${TITLE_FONT}, 'Arial Black', sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (styleId === 'neon') {
    // A dark glassy fill inside a bright glowing outline, stroked twice:
    // once wide and blurred for the halo, once tight for the tube itself.
    ctx.fillStyle = 'rgba(6, 10, 26, 0.82)';
    ctx.fillText(words, cx, baselineY);
    ctx.shadowColor = 'rgba(0, 229, 255, 0.95)';
    ctx.shadowBlur = size * 0.34;
    ctx.strokeStyle = '#37e6ff';
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.strokeText(words, cx, baselineY);
    ctx.shadowColor = 'rgba(255, 45, 190, 0.85)';
    ctx.shadowBlur = size * 0.16;
    ctx.strokeStyle = '#ff5fd2';
    ctx.lineWidth = Math.max(1.5, size * 0.028);
    ctx.strokeText(words, cx, baselineY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(235, 252, 255, 0.92)';
    ctx.fillText(words, cx, baselineY);
  } else if (styleId === 'block') {
    // Solid white block letters with a hard offset shadow and black keyline.
    const off = Math.max(3, size * 0.07);
    ctx.fillStyle = 'rgba(10, 6, 18, 0.9)';
    ctx.fillText(words, cx + off, baselineY + off);
    ctx.strokeStyle = '#12081f';
    ctx.lineWidth = Math.max(3, size * 0.11);
    ctx.strokeText(words, cx, baselineY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(words, cx, baselineY);
  } else {
    // Sunset Chrome (default): a vertical metal gradient over a dark
    // outline, with a soft drop shadow so it lifts off any photo.
    const top = baselineY - size;
    const metal = ctx.createLinearGradient(0, top, 0, baselineY);
    metal.addColorStop(0, '#fff6d8');
    metal.addColorStop(0.34, '#ffd34d');
    metal.addColorStop(0.58, '#ff7a3c');
    metal.addColorStop(0.8, '#ff3d8a');
    metal.addColorStop(1, '#b832ff');
    ctx.shadowColor = 'rgba(10, 0, 24, 0.55)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.045;
    ctx.strokeStyle = '#1c0b2e';
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.strokeText(words, cx, baselineY);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = metal;
    ctx.fillText(words, cx, baselineY);
    // A thin bright top edge sells the chrome.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - size * 6, top, size * 12, size * 0.3);
    ctx.clip();
    ctx.fillText(words, cx, baselineY);
    ctx.restore();
  }
  ctx.restore();
}
