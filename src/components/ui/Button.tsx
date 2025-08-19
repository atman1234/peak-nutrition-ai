import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, TextStyles, Spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    TextStyles.button,
    styles.text,
    styles[`${variant}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },

  // Variants
  primary: {
    backgroundColor: Colors.gold,
  },
  secondary: {
    backgroundColor: Colors.sage,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Text variants
  primaryText: {
    color: Colors.textOnPrimary,
  },
  secondaryText: {
    color: Colors.textOnPrimary,
  },
  outlineText: {
    color: Colors.gold,
  },
  ghostText: {
    color: Colors.gold,
  },

  // Sizes
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.padding.button,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
});