// Colour grades: a canvas filter for the photos plus a coloured overlay washed over
// the whole cover, and the sky gradient the tilted layout paints behind its panels.
// All colours are the app's own sunset / neon palette — no artwork is borrowed.

/** The export sizes the editor offers, in pixels. */
export const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

/** Title lettering styles. */
export const TITLE_STYLES = {
  gradient: { label: 'Sunset gradient' },
  solid: { label: 'Solid white' },
  outline: { label: 'Neon outline' },
};

/** One grade: a CSS filter for each photo, an overlay gradient over the cover, and a sky. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    overlay: [
      [0, 'rgba(255, 150, 60, 0.10)'],
      [0.55, 'rgba(255, 80, 120, 0.10)'],
      [1, 'rgba(140, 30, 255, 0.22)'],
    ],
    blend: 'overlay',
    sky: ['#2b1055', '#ff7e2e', '#ffd319'],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.15) brightness(0.95)',
    overlay: [
      [0, 'rgba(255, 41, 117, 0.16)'],
      [0.5, 'rgba(20, 10, 60, 0.05)'],
      [1, 'rgba(34, 230, 210, 0.20)'],
    ],
    blend: 'overlay',
    sky: ['#0d0221', '#ff2975', '#22e6d2'],
  },
  teal: {
    label: 'Palm Teal',
    filter: 'saturate(1.25) contrast(1.05) sepia(0.12)',
    overlay: [
      [0, 'rgba(34, 230, 210, 0.12)'],
      [1, 'rgba(255, 170, 60, 0.14)'],
    ],
    blend: 'soft-light',
    sky: ['#062a33', '#22e6d2', '#ffd319'],
  },
  haze: {
    label: 'Heat Haze',
    filter: 'saturate(1.15) contrast(0.95) brightness(1.08) sepia(0.22)',
    overlay: [
      [0, 'rgba(255, 200, 120, 0.16)'],
      [1, 'rgba(255, 120, 60, 0.10)'],
    ],
    blend: 'soft-light',
    sky: ['#4a2b18', '#ff9a3d', '#ffe9a8'],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(0.92)',
    overlay: [
      [0, 'rgba(255, 41, 117, 0.10)'],
      [1, 'rgba(10, 10, 30, 0.18)'],
    ],
    blend: 'overlay',
    sky: ['#111122', '#3d2b56', '#8c8ca8'],
  },
};

/** Builds a vertical gradient from a grade's overlay stops. */
export function gradeOverlayGradient(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [pos, color] of grade.overlay) g.addColorStop(pos, color);
  return g;
}
