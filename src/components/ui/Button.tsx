import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, TextStyles, Spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
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
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    base: {
      borderRadius: Spacing.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    primary: {
      backgroundColor: colors.gold,
    },
    secondary: {
      backgroundColor: colors.sage,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.gold,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    sm: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    md: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    lg: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    disabled: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
    },
    text: {
      fontWeight: '600',
    },
    primaryText: {
      color: '#FFFFFF',
    },
    secondaryText: {
      color: colors.textOnPrimary,
    },
    outlineText: {
      color: colors.gold,
    },
    ghostText: {
      color: colors.textSecondary,
    },
  }), [colors]);

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
          color={variant === 'primary' ? '#FFFFFF' : variant === 'secondary' ? colors.textOnPrimary : colors.gold}
          size="small"
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}