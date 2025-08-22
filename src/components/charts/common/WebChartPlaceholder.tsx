import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/constants';

interface WebChartPlaceholderProps {
  title: string;
  height?: number;
  icon?: string;
}

export const WebChartPlaceholder: React.FC<WebChartPlaceholderProps> = ({
  title,
  height = 200,
  icon = '📊'
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '600',
    },
    subtext: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{icon} {title}</Text>
      <Text style={styles.subtext}>
        Interactive charts available on mobile app
      </Text>
    </View>
  );
};