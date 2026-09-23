export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  surface: string;
  card: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warn: string;
  warnSoft: string;
  border: string;
  shadow: string;
  stripe: string;
  skeleton: string;
  overlay: string;
}

export const lightColors: ColorTokens = {
  surface: '#FAF7F2',
  card: '#FFFFFF',
  ink: '#1C1A17',
  muted: '#6B655C',
  accent: '#C1502E',
  accentSoft: '#F7EAE4',
  success: '#4F7A5B',
  successSoft: '#EAF0EB',
  warn: '#C8892B',
  warnSoft: '#FAF0DF',
  border: '#EBE5DC',
  shadow: '0 1px 3px rgba(28,26,23,0.08)',
  stripe: 'rgba(28,26,23,0.055)',
  skeleton: '#F0EBE3',
  overlay: 'rgba(28,26,23,0.4)',
};

export const darkColors: ColorTokens = {
  surface: '#17150F',
  card: '#211E19',
  ink: '#F1EDE5',
  muted: '#A29A8D',
  accent: '#D9663F',
  accentSoft: '#33221B',
  success: '#6E9C7A',
  successSoft: '#1E2620',
  warn: '#DDA24C',
  warnSoft: '#2C2418',
  border: '#332E26',
  shadow: '0 1px 3px rgba(0,0,0,0.35)',
  stripe: 'rgba(241,237,229,0.06)',
  skeleton: '#2A2620',
  overlay: 'rgba(0,0,0,0.55)',
};

export function colorsFor(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkColors : lightColors;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  input: 12,
  card: 16,
  pill: 999,
};

export const fontFamilies = {
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  bnRegular: 'NotoSansBengali_400Regular',
  bnMedium: 'NotoSansBengali_500Medium',
  bnSemiBold: 'NotoSansBengali_600SemiBold',
  bnBold: 'NotoSansBengali_700Bold',
  mono: 'IBMPlexMono_500Medium',
};

// Numerals and Latin body copy always render in Inter; Bangla dish names / UI copy
// render in Noto Sans Bengali, which is visually taller and needs 1.6 line-height
// so matras and descenders don't clip (see design brief).
export function scriptFonts(lang: 'bn' | 'en') {
  return {
    regular: lang === 'en' ? fontFamilies.interRegular : fontFamilies.bnRegular,
    medium: lang === 'en' ? fontFamilies.interMedium : fontFamilies.bnMedium,
    semiBold: lang === 'en' ? fontFamilies.interSemiBold : fontFamilies.bnSemiBold,
    bold: lang === 'en' ? fontFamilies.interBold : fontFamilies.bnBold,
    lineHeightMultiplier: lang === 'en' ? 1.35 : 1.6,
  };
}
