import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  height?: number;
  noPadding?: boolean;
  actions?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  height = 300,
  noPadding = false,
  actions,
}) => {
  const { colors } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: subtitle ? 8 : 16,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    chartContent: {
      minHeight: height,
      paddingHorizontal: noPadding ? 0 : 16,
      paddingBottom: noPadding ? 0 : 16,
    },
    loadingContainer: {
      height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      height,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      textAlign: 'center',
      marginTop: 8,
    },
    emptyContainer: {
      height,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    chartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
  }), [colors, height, noPadding]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {actions}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {actions}
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {actions}
      </View>
      <View style={styles.chartContent}>
        <View style={styles.chartWrapper}>
          {children}
        </View>
      </View>
    </View>
  );
};

// Chart period selector component
export const ChartPeriodSelector: React.FC<{
  periods: Array<{ label: string; value: string }>;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}> = ({ periods, selectedPeriod, onPeriodChange }) => {
  const { colors } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodButton: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    periodTextActive: {
      color: colors.card,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.value}
          style={[
            styles.periodButton,
            selectedPeriod === period.value && styles.periodButtonActive,
          ]}
          onPress={() => onPeriodChange(period.value)}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period.value && styles.periodTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Chart legend component
export const ChartLegend: React.FC<{
  data: Array<{ label: string; color: string; value?: string | number }>;
  horizontal?: boolean;
}> = ({ data, horizontal = true }) => {
  const { colors } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: horizontal ? 'row' : 'column',
      flexWrap: horizontal ? 'wrap' : 'nowrap',
      justifyContent: horizontal ? 'center' : 'flex-start',
      marginTop: 12,
      paddingHorizontal: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: horizontal ? 16 : 0,
      marginBottom: horizontal ? 8 : 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    legendLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    legendValue: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '600',
      marginLeft: 4,
    },
  }), [colors, horizontal]);

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
          {item.value !== undefined && (
            <Text style={styles.legendValue}>{item.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

// Empty state component for charts
export const ChartEmptyState: React.FC<{
  message?: string;
  icon?: React.ReactNode;
}> = ({ message = 'No data available', icon }) => {
  const { colors } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    text: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: icon ? 12 : 0,
    },
  }), [colors, icon]);

  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};