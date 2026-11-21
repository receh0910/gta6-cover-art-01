// Colour grades: the cinematic looks the cover can wear.
//
// A grade is a small stack of plain canvas operations, applied in
// order: a filter on each photo as it is drawn, then a few full-cover
// light layers (split-tone gradients, a sun glow, a shadow tint)
// composited over the panels, then a vignette and film grain. One
// grade covers the whole poster so every panel shares the same light,
// while the split-tone reacts to each photo's own highlights and
// shadows, so panels keep their character inside one harmonious look.
// Everything is deterministic: the same cover renders identically in
// the preview and in every export size.

/** The grades the editor offers, in menu order. */
export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset' },
  { id: 'neon', name: 'Neon Night' },
  { id: 'golden', name: 'Golden Hour' },
  { id: 'noir', name: 'Mono Noir' },
];

/** Returns the grade record for an id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

// Each look: the photo filter, the light layers painted over the whole
// cover (top to bottom), the vignette strength and the grain opacity.
// Layer stops are [offset, colour]; radial layers add cx, cy and r as
// fractions of the cover size (r of the longer side).
const GRADE_LOOKS = {
  // Vice Sunset: late-evening light — golden highlights, a low sun
  // glow, and deep teal-plum shadows. The hero grade.
  sunset: {
    filter: 'saturate(1.5) contrast(1.14) brightness(1.0) sepia(0.22)',
    layers: [
      { mode: 'overlay', kind: 'linear', stops: [[0, 'rgba(255, 150, 50, 0.55)'], [0.45, 'rgba(255, 90, 80, 0.16)'], [1, 'rgba(58, 10, 92, 0.38)']] },
      { mode: 'screen', kind: 'radial', cx: 0.3, cy: 0.16, r: 0.95, stops: [[0, 'rgba(255, 182, 82, 0.42)'], [0.42, 'rgba(255, 120, 60, 0.14)'], [1, 'rgba(255, 100, 50, 0)']] },
      { mode: 'soft-light', kind: 'linear', stops: [[0.45, 'rgba(0, 42, 64, 0)'], [1, 'rgba(8, 24, 74, 0.6)']] },
    ],
    vignette: 0.5,
    grain: 0.1,
  },
  // Neon Night: controlled contrast with a luminous cyan/magenta
  // split tone; the glow blooms without blowing out the highlights.
  neon: {
    filter: 'saturate(1.55) contrast(1.22) brightness(0.9) hue-rotate(-6deg)',
    layers: [
      { mode: 'screen', kind: 'linear', stops: [[0, 'rgba(0, 160, 255, 0.3)'], [0.52, 'rgba(30, 40, 190, 0.1)'], [1, 'rgba(150, 0, 180, 0.2)']] },
      { mode: 'soft-light', kind: 'linear', stops: [[0, 'rgba(0, 232, 255, 0.38)'], [0.55, 'rgba(90, 60, 255, 0.12)'], [1, 'rgba(255, 0, 170, 0.38)']] },
      { mode: 'screen', kind: 'radial', cx: 0.5, cy: 0.34, r: 0.85, stops: [[0, 'rgba(140, 225, 255, 0.15)'], [1, 'rgba(0, 0, 0, 0)']] },
    ],
    vignette: 0.6,
    grain: 0.08,
  },
  // Golden Hour: classy warm highlights over deep warm shadows, with
  // the vignette woven into the grade for real depth.
  golden: {
    filter: 'saturate(1.35) contrast(1.12) brightness(1.03) sepia(0.3)',
    layers: [
      { mode: 'overlay', kind: 'linear', stops: [[0, 'rgba(255, 192, 92, 0.52)'], [0.5, 'rgba(255, 150, 60, 0.14)'], [1, 'rgba(96, 42, 12, 0.32)']] },
      { mode: 'screen', kind: 'radial', cx: 0.26, cy: 0.14, r: 0.9, stops: [[0, 'rgba(255, 202, 112, 0.36)'], [1, 'rgba(255, 170, 80, 0)']] },
      { mode: 'multiply', kind: 'linear', stops: [[0, '#ffffff'], [0.55, '#ffffff'], [1, '#b07f3e']] },
    ],
    vignette: 0.55,
    grain: 0.1,
  },
  // Mono Noir: true black-and-white, a hard contrast curve, cool
  // silver highlights over blue-black shadows, heavy grain.
  noir: {
    filter: 'grayscale(1) contrast(1.38) brightness(1.02)',
    layers: [
      { mode: 'soft-light', kind: 'linear', stops: [[0, 'rgba(205, 218, 255, 0.2)'], [1, 'rgba(8, 14, 42, 0.32)']] },
      { mode: 'multiply', kind: 'linear', stops: [[0, '#ffffff'], [0.68, '#ffffff'], [1, '#5f5f68']] },
    ],
    vignette: 0.72,
    grain: 0.24,
  },
};

/** The look (filter, light layers, vignette, grain) for a grade id. */
export function gradeLook(id) {
  return GRADE_LOOKS[id] ?? GRADE_LOOKS.sunset;
}

/**
 * Paints the grade's light layers over the whole cover: split-tone
 * gradients and glows composited so they react to the photos beneath.
 */
export function paintGradeLayers(ctx, w, h, look) {
  for (const layer of look.layers ?? []) {
    ctx.save();
    ctx.globalCompositeOperation = layer.mode;
    let gradient;
    if (layer.kind === 'radial') {
      const cx = (layer.cx ?? 0.5) * w;
      const cy = (layer.cy ?? 0.5) * h;
      const r = (layer.r ?? 1) * Math.max(w, h);
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 0, h);
    }
    for (const [stop, colour] of layer.stops) gradient.addColorStop(stop, colour);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/** Darkens the corners of a rect with a soft radial vignette. */
export function paintVignette(ctx, x, y, w, h, strength) {
  if (strength <= 0) return;
  const radius = Math.hypot(w, h) / 2;
  const gradient = ctx.createRadialGradient(
    x + w / 2, y + h / 2, radius * 0.42,
    x + w / 2, y + h / 2, radius,
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
}

let grainTile = null;

/**
 * A small reusable noise tile for film grain. Built once from a fixed
 * pseudo-random sequence so every render of the same cover is identical.
 */
function makeGrainTile() {
  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(size, size);
  let seed = 123456789;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(next() * 255);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  return tile;
}

/** Sprinkles deterministic film grain over a rect at a low opacity. */
export function paintGrain(ctx, x, y, w, h, opacity) {
  if (opacity <= 0) return;
  if (!grainTile) grainTile = makeGrainTile();
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
