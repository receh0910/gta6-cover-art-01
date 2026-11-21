// Panel geometry for the Vice Grid cover layouts.
//
// Every layout is a list of panel rectangles expressed as fractions of the
// cover's width and height, so the same layout works at 1080 x 1080,
// 1080 x 1350 and 1920 x 1080. The renderer turns these fractions into
// pixels for whatever size it is drawing.

/** The layouts the editor offers, in menu order. */
export const LAYOUTS = [
  { id: 'hero-duo', name: 'Hero + Duo', panels: 3 },
  { id: 'quad', name: 'Quad Grid', panels: 4 },
  { id: 'triptych', name: 'Triptych', panels: 3 },
  { id: 'hero-strip', name: 'Hero + Strip', panels: 4 },
  { id: 'full-bleed', name: 'Full Bleed', panels: 1 },
];

/** Returns the layout record for an id, falling back to the first layout. */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

/**
 * Panel rectangles for a layout, as {x, y, w, h} fractions of the cover.
 * `gap` is the gutter between panels, also as a fraction of the cover's
 * smaller side, so the grid breathes the same way at every size.
 */
export function panelRects(layoutId, gap) {
  const g = Math.max(0, Math.min(0.06, gap));
  switch (layoutId) {
    case 'full-bleed':
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    case 'quad': {
      const w = (1 - g) / 2;
      const h = (1 - g) / 2;
      return [
        { x: 0, y: 0, w, h },
        { x: w + g, y: 0, w, h },
        { x: 0, y: h + g, w, h },
        { x: w + g, y: h + g, w, h },
      ];
    }
    case 'triptych': {
      const side = (1 - 2 * g) * 0.3;
      const mid = 1 - 2 * g - 2 * side;
      return [
        { x: 0, y: 0, w: side, h: 1 },
        { x: side + g, y: 0, w: mid, h: 1 },
        { x: side + g + mid + g, y: 0, w: side, h: 1 },
      ];
    }
    case 'hero-strip': {
      const heroH = (1 - g) * 0.68;
      const stripH = 1 - g - heroH;
      const cellW = (1 - 2 * g) / 3;
      return [
        { x: 0, y: 0, w: 1, h: heroH },
        { x: 0, y: heroH + g, w: cellW, h: stripH },
        { x: cellW + g, y: heroH + g, w: cellW, h: stripH },
        { x: 2 * (cellW + g), y: heroH + g, w: cellW, h: stripH },
      ];
    }
    case 'hero-duo':
    default: {
      const heroW = (1 - g) * 0.62;
      const sideW = 1 - g - heroW;
      const topH = (1 - g) * 0.56;
      const botH = 1 - g - topH;
      return [
        { x: 0, y: 0, w: heroW, h: 1 },
        { x: heroW + g, y: 0, w: sideW, h: topH },
        { x: heroW + g, y: topH + g, w: sideW, h: botH },
      ];
    }
  }
}
