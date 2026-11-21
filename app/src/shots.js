// Fixed scenes for screenshots, driven by the ?shot= query.
//
// ?shot=cover  — the finished cover alone, filling the window (controls hidden).
// ?shot=editor — the full editor with sample photos loaded and controls visible.
//
// Scene parameters (all optional):
//   size=1920x1080 | 1080x1080 | 1080x1350   the cover's pixel size
//   layout=hero-duo | quad | triptych | hero-strip | full-bleed
//   grade=sunset | neon | golden | noir
//   lettering=chrome | neon | block
//   caption=<words>                            the title text
//   photos=pier,boulevard,pier                 sample per panel (cycles)
//   crops=1.2:0.42:0.32,1.6:0.55:0.24,...      per-panel framing: zoom
//                                              and the photo point (fx, fy
//                                              as image fractions) centred
//                                              in the panel
//   pos=bottom | top                           title band position
//   vice=on | off                              Vice backdrop (default on)
//   sun=1.05                                   sun size multiplier
//   sunpos=left | center | right               sun position preset
//
// window.__shotReady is set once the scene has painted, so a screenshot
// tool can wait for it instead of guessing with sleeps.

const SAMPLES = ['pier', 'boulevard'];

/** Parses "1920x1080" into {w, h}, falling back to the landscape size. */
function parseSize(raw) {
  const match = /^(\d+)x(\d+)$/.exec(raw ?? '');
  if (!match) return { w: 1920, h: 1080 };
  return { w: Number(match[1]), h: Number(match[2]) };
}

/**
 * Parses "1.6:0.55:0.24,2.2:0.72:0.58" into per-panel crop specs
 * [{zoom, fx, fy}, ...]; a malformed entry becomes null (default crop).
 */
function parseCrops(raw) {
  if (!raw) return [];
  return raw.split(',').map((part) => {
    const [zoom, fx, fy] = part.split(':').map(Number);
    if (![zoom, fx, fy].every(Number.isFinite)) return null;
    return { zoom: Math.max(1, zoom), fx, fy };
  });
}

/**
 * Applies a screenshot scene: hands the parsed scene to `apply`, which
 * loads the sample photos, sets the editor state and renders. Resolves
 * after two animation frames so the paint is on screen.
 */
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = (query.get('photos') ?? 'pier,boulevard,pier,boulevard')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => SAMPLES.includes(name));
  const scene = {
    size: parseSize(query.get('size')),
    layout: query.get('layout') ?? 'hero-duo',
    grade: query.get('grade') ?? 'sunset',
    lettering: query.get('lettering') ?? 'chrome',
    caption: query.get('caption') ?? 'Sunset Heist',
    captionPos: query.get('pos') ?? 'bottom',
    photos: names.length ? names : SAMPLES,
    crops: parseCrops(query.get('crops')),
    vice: (query.get('vice') ?? 'on') !== 'off',
    viceSun: Number(query.get('sun')) || 1,
    vicePos: query.get('sunpos') ?? 'center',
  };
  await apply(scene);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
