import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, TextStyles, Spacing } from '../../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.gold,
  text,
  fullscreen = false,
}: LoadingSpinnerProps) {
  const containerStyle = fullscreen
    ? styles.fullscreenContainer
    : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});