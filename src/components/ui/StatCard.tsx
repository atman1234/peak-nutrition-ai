import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = Colors.sage,
  trend,
  trendValue,
  style,
}: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return Colors.success;
      case 'down':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const combinedStyle = StyleSheet.flatten([styles.container, style]);
  
  return (
    <Card variant="elevated" style={combinedStyle}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon()}
                size={16}
                color={getTrendColor()}
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
  },
  title: {
    ...TextStyles.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  value: {
    ...TextStyles.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
  },
  iconContainer: {
    marginLeft: Spacing.md,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trendText: {
    ...TextStyles.caption,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});