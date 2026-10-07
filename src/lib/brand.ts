// UST Brand Tokens - per brand.ust.com
export const brand = {
  // Primary palette
  darkTeal: '#006E74',
  lightTeal: '#0097AC',
  tealDeep: '#004851',
  softBlack: '#231F20',
  white: '#FFFFFF',
  offWhite: '#EEF6F7',

  // Secondary / semantic
  green: '#0a9b72',
  coral: '#e0604a',
  warm: '#c75b45',

  // Derived tokens
  muted: 'rgba(35, 31, 32, 0.72)',
  muted2: 'rgba(35, 31, 32, 0.55)',
  border: 'rgba(0, 110, 116, 0.18)',
  borderStrong: 'rgba(0, 151, 172, 0.35)',
} as const;

export const fonts = {
  display: '"Source Serif 4", Georgia, "Times New Roman", serif',
  body: '"Source Sans 3", system-ui, -apple-system, sans-serif',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
} as const;
