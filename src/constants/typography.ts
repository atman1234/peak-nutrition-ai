import { TextStyle } from 'react-native';

export const Typography = {
  // Font families (Inter is default in Expo)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Font weights
  fontWeight: {
    normal: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

// Pre-defined text styles
export const TextStyles = {
  h1: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
  } as TextStyle,

  h2: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
  } as TextStyle,

  h3: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.normal,
  } as TextStyle,

  h4: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.normal,
  } as TextStyle,

  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  } as TextStyle,

  bodyLarge: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.normal,
  } as TextStyle,

  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  } as TextStyle,

  caption: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
  } as TextStyle,

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    letterSpacing: Typography.letterSpacing.wide,
  } as TextStyle,

  button: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    letterSpacing: Typography.letterSpacing.wide,
  } as TextStyle,
};