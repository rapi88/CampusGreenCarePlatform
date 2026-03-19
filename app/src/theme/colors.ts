export const Colors = {
  // Primary greens
  greenPrimary: '#4CAF50',
  greenLight: '#E8F5E9',
  greenDark: '#2E7D32',
  greenMid: '#66BB6A',

  // Status
  statusOk: '#4CAF50',
  statusDue: '#F44336',
  statusSoon: '#FF9800',

  // Neutrals
  neutralBg: '#F5F7F5',
  neutralDark: '#1C1C1E',
  neutralMid: '#6E6E73',
  neutralLight: '#D1D1D6',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',

  // Overlays
  overlay: 'rgba(0,0,0,0.35)',
  shadow: 'rgba(0,0,0,0.08)',

  // Accent
  accent: '#00C853',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
} as const;

export type Color = keyof typeof Colors;
