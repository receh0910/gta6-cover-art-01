// The Vice backdrop: a retro Vice City sun and palm silhouettes.
//
// One atmosphere idea drawn over the photo panels so a cover reads as
// the Vice City world — a low striped sun in a sunset sky, palms
// framing the corners — instead of a plain holiday collage. The sun
// is a gradient disc with horizontal retro cuts across its lower
// half, composited with 'screen' so it integrates like real light;
// the palms are dark silhouettes kept low in the bottom corners.
// Everything is drawn with plain canvas paths from fixed geometry:
// no assets, no randomness, identical at every export size.

/** Sun position presets, as fractions of the cover size. */
export const SUN_POSITIONS = [
  { id: 'left', name: 'Left', x: 0.24, y: 0.3 },
  { id: 'center', name: 'Centre', x: 0.5, y: 0.32 },
  { id: 'right', name: 'Right', x: 0.76, y: 0.3 },
];

/** Returns the sun position record for an id, falling back to Centre. */
export function sunPositionById(id) {
  return SUN_POSITIONS.find((pos) => pos.id === id) ?? SUN_POSITIONS[1];
}

// Retro cuts across the sun's lower half: [start, end] as fractions
// of the radius below the centre, thickening toward the bottom.
const SUN_CUTS = [[0.1, 0.16], [0.32, 0.41], [0.54, 0.66], [0.76, 0.9]];

let sunCache = { radius: 0, canvas: null };

/**
 * Builds the sun disc on an offscreen canvas: a yellow-to-pink
 * vertical gradient with the retro cuts punched out, so the photo
 * shows through the gaps once the disc is screened over the cover.
 * Cached by radius — the preview re-renders on every control input.
 */
function makeSunCanvas(radius) {
  const rounded = Math.max(8, Math.round(radius));
  if (sunCache.canvas && sunCache.radius === rounded) return sunCache.canvas;
  const size = rounded * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const sctx = canvas.getContext('2d');
  const gradient = sctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#ffe873');
  gradient.addColorStop(0.35, '#ffc93c');
  gradient.addColorStop(0.62, '#ff8a3c');
  gradient.addColorStop(0.82, '#ff5270');
  gradient.addColorStop(1, '#ff2e88');
  sctx.fillStyle = gradient;
  sctx.beginPath();
  sctx.arc(rounded, rounded, rounded, 0, Math.PI * 2);
  sctx.fill();
  sctx.globalCompositeOperation = 'destination-out';
  for (const [from, to] of SUN_CUTS) {
    sctx.fillRect(0, rounded + from * rounded, size, (to - from) * rounded);
  }
  sunCache = { radius: rounded, canvas };
  return canvas;
}

/**
 * Draws one palm frond: a broad tapered leaf from the crown that
 * arcs up and droops to its tip. The two edges bulge unequally —
 * the fuller edge faces up, against the droop — so the leaf reads
 * as a hanging frond rather than a symmetric petal.
 */
function drawFrond(ctx, cx, cy, angleDeg, length, width, droop) {
  const angle = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const tipX = cx + dx * length;
  const tipY = cy + dy * length + droop;
  // Spine control: lifted against the droop so the frond arcs.
  const spineX = cx + dx * length * 0.45;
  const spineY = cy + dy * length * 0.45 - droop * 0.2;
  // Normal to the spine; `up` picks the side facing away from the droop.
  const nx = -dy;
  const ny = dx;
  const up = dx >= 0 ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(spineX + up * nx * width, spineY + up * ny * width, tipX, tipY);
  ctx.quadraticCurveTo(
    spineX - up * nx * width * 0.3,
    spineY - up * ny * width * 0.3 + droop * 0.12,
    cx, cy,
  );
  ctx.closePath();
  ctx.fill();
}

// Frond fan: [angle degrees, length as a fraction of palm height,
// droop as a fraction of palm height]. The side fronds droop past
// crown level, the top ones stay high — a hanging palm crown, not a
// starburst. Fixed, so every render draws the same palms.
const FRONDS = [
  [-172, 0.46, 0.42],
  [-148, 0.6, 0.44],
  [-122, 0.66, 0.38],
  [-96, 0.6, 0.26],
  [-70, 0.66, 0.38],
  [-44, 0.6, 0.44],
  [-18, 0.46, 0.42],
];

// A shorter back layer, offset between the main fronds, drawn first
// so the crown has density instead of seven separate spikes.
const FRONDS_BACK = [
  [-160, 0.38, 0.3],
  [-110, 0.44, 0.24],
  [-82, 0.44, 0.24],
  [-30, 0.38, 0.3],
];

/**
 * Draws one palm silhouette anchored at (baseX, baseY), `height` tall,
 * leaning toward `lean` (1 = right, -1 = left). `tiltDeg` rotates the
 * frond fan a few degrees so the two corner palms are not mirror
 * stamps of each other.
 */
function drawPalm(ctx, baseX, baseY, height, lean, tiltDeg, colour) {
  const crownX = baseX + lean * height * 0.32;
  const crownY = baseY - height;
  const baseW = height * 0.105;
  const topW = height * 0.034;
  const ctrlX = baseX + lean * height * 0.07;
  const ctrlY = baseY - height * 0.55;
  ctx.save();
  ctx.fillStyle = colour;
  // Trunk: a tapered ribbon following one quadratic curve.
  ctx.beginPath();
  ctx.moveTo(baseX - baseW / 2, baseY);
  ctx.quadraticCurveTo(ctrlX - topW / 2, ctrlY, crownX - topW / 2, crownY);
  ctx.lineTo(crownX + topW / 2, crownY);
  ctx.quadraticCurveTo(ctrlX + topW / 2, ctrlY, baseX + baseW / 2, baseY);
  ctx.closePath();
  ctx.fill();
  // Crown of fronds: short back layer first, then the main fan.
  for (const [angle, lengthFrac, droopFrac] of FRONDS_BACK) {
    drawFrond(ctx, crownX, crownY, angle + tiltDeg, height * lengthFrac, height * 0.05, height * droopFrac);
  }
  for (const [angle, lengthFrac, droopFrac] of FRONDS) {
    drawFrond(ctx, crownX, crownY, angle + tiltDeg, height * lengthFrac, height * 0.065, height * droopFrac);
  }
  ctx.restore();
}

/**
 * Paints the Vice backdrop over the cover: a soft halo and the
 * striped sun screened in like evening light, then palm silhouettes
 * framing the bottom corners. opts: { sunSize, sunPos }.
 */
export function paintViceBackdrop(ctx, w, h, opts = {}) {
  const pos = sunPositionById(opts.sunPos);
  const unit = Math.min(w, h);
  const radius = unit * 0.17 * (opts.sunSize ?? 1);
  const cx = pos.x * w;
  const cy = pos.y * h;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  // Halo first, so the disc sits in its own glow.
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.4);
  halo.addColorStop(0, 'rgba(255, 170, 80, 0.4)');
  halo.addColorStop(0.5, 'rgba(255, 110, 90, 0.15)');
  halo.addColorStop(1, 'rgba(255, 90, 120, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  // The striped disc itself.
  ctx.globalAlpha = 0.92;
  ctx.drawImage(makeSunCanvas(radius), cx - radius, cy - radius);
  ctx.restore();

  // Palms last (over the glow), dark plum silhouettes in the corners.
  const colour = 'rgba(18, 7, 30, 0.93)';
  drawPalm(ctx, w * 0.015, h, h * 0.32, 1, 6, colour);
  drawPalm(ctx, w * 0.985, h, h * 0.27, -1, -6, colour);
}
