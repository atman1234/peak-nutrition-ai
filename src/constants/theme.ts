import { useColorScheme } from 'react-native';

// Light theme colors
const lightColors = {
  // Primary colors
  midnight: '#0F172A',
  gold: '#F59E0B',
  sage: '#10B981',
  crimson: '#EF4444',
  
  // Neutral colors
  platinum: '#F8FAFC',
  pearl: '#E2E8F0',
  silver: '#94A3B8',
  slate: '#64748B',
  charcoal: '#475569',
  
  // Semantic colors
  primary: '#0F172A',
  secondary: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  
  // Text colors
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#0F172A',
  
  // Border colors
  border: '#E2E8F0',
  borderFocus: '#F59E0B',
  borderError: '#EF4444',
  
  // Shadow colors
  shadow: '#000000',
  
  // Transparent overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(248, 250, 252, 0.9)',
} as const;

// Dark theme colors
const darkColors = {
  // Primary colors (keep accent colors the same)
  midnight: '#F8FAFC', // Inverted for dark mode
  gold: '#F59E0B',
  sage: '#10B981',
  crimson: '#EF4444',
  
  // Neutral colors (dark theme variants)
  platinum: '#1E293B',
  pearl: '#334155',
  silver: '#64748B',
  slate: '#94A3B8',
  charcoal: '#CBD5E1',
  
  // Semantic colors
  primary: '#F8FAFC',
  secondary: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors (dark variants)
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  
  // Text colors (inverted)
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textOnPrimary: '#0F172A',
  textOnSecondary: '#F8FAFC',
  
  // Border colors (dark variants)
  border: '#334155',
  borderFocus: '#F59E0B',
  borderError: '#EF4444',
  
  // Shadow colors
  shadow: '#000000',
  
  // Transparent overlays (dark variants)
  overlay: 'rgba(15, 23, 42, 0.8)',
  overlayLight: 'rgba(30, 41, 59, 0.9)',
} as const;

export function useTheme() {
  const colorScheme = useColorScheme();
  
  return {
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    isDark: colorScheme === 'dark',
  };
}

export type ColorName = keyof typeof lightColors;

// For backward compatibility, export the light colors as default
export const Colors = lightColors;