import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme, TextStyles, Spacing } from '../../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color,
  text,
  fullscreen = false,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color || colors.gold;
  
  // Create dynamic styles based on theme
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    fullscreenContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    text: {
      ...TextStyles.bodySmall,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
  }), [colors]);

  const containerStyle = fullscreen
    ? styles.fullscreenContainer
    : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

