export interface ColorPalette {
  background: string;
  card: string;
  modal: string;
  inputBg: string;
  border: string;
  borderLight: string;
  textHeading: string;
  textBody: string;
  textMuted: string;
  primary: string;
  secondary: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  success: string;
  error: string;
  shadow: string;
}

export const lightColors: ColorPalette = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  modal: '#FAF8F5',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  border: '#EBE5DC',
  borderLight: '#F3EFEA',
  textHeading: '#211D1A',
  textBody: '#5F5850',
  textMuted: '#8C8377',
  primary: '#B5814C',
  secondary: '#D99F50',
  accent: '#C88E3E',
  accentBg: 'rgba(181, 129, 76, 0.09)',
  accentBorder: 'rgba(181, 129, 76, 0.35)',
  success: '#10B981',
  error: '#EF4444',
  shadow: 'rgba(33, 29, 26, 0.08)',
};

export const darkColors: ColorPalette = {
  background: '#0B0907',
  card: '#161310',
  modal: '#14110E',
  inputBg: '#1D1915',
  border: 'rgba(60, 52, 44, 0.85)',
  borderLight: 'rgba(45, 39, 33, 0.6)',
  textHeading: '#FAF8F5',
  textBody: '#A89F91',
  textMuted: '#7E7569',
  primary: '#C88E3E',
  secondary: '#B5814C',
  accent: '#D99F50',
  accentBg: 'rgba(200, 142, 62, 0.14)',
  accentBorder: 'rgba(200, 142, 62, 0.35)',
  success: '#34D399',
  error: '#F87171',
  shadow: 'rgba(0, 0, 0, 0.65)',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
  },
};
