import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/constants';

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({ children, height = 300 }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      height,
    },
  });

  return <View style={styles.container}>{children}</View>;
};

// Chart theme colors for Recharts components
export const useChartTheme = () => {
  const { colors } = useTheme();
  
  return {
    text: colors.text,
    textSecondary: colors.textSecondary,
    grid: colors.border,
    background: colors.surface,
    axis: colors.textSecondary,
    tooltip: {
      background: colors.surface,
      border: colors.border,
      text: colors.text,
    },
  };
};