import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Shadows } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) {
  const paddingValue = typeof Spacing[padding] === 'number' ? Spacing[padding] : 16;
  
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: paddingValue },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
  },
  default: {
    ...Shadows.sm,
  },
  elevated: {
    ...Shadows.elegant,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});