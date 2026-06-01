/** Mã icon mega-menu — FE map sang Lucide / SVG tương ứng */
export const NAVIGATION_ICON_CODES = [
  'wifi',
  'play-circle',
  'cctv',
  'home-wifi',
  'shield',
  'plus-circle',
] as const;

export type NavigationIconCode = (typeof NAVIGATION_ICON_CODES)[number];
