import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useTheme } from '@/constants/theme';


interface ComparativeChartProps {
  comparisonType?: 'week' | 'month';
  metricType?: 'calories' | 'weight' | 'macros';
  height?: number;
}

export const ComparativeChart: React.FC<ComparativeChartProps> = ({
  comparisonType = 'week',
  metricType = 'calories',
  height = 350,
}) => {
  const chartColors = useChartColors();
  const { colors } = useTheme();
  
  // Use historical analytics for current and previous periods
  const currentTimePeriod = comparisonType === 'week' ? '7d' : '30d';
  const { foodLogs: currentPeriodLogs, isLoading: currentLoading } = useHistoricalAnalytics({
    timePeriod: currentTimePeriod,
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'],
  });
  
  // For previous period, we'll use a simplified approach with same period length
  const { foodLogs: previousPeriodLogs, isLoading: previousLoading } = useHistoricalAnalytics({
    timePeriod: comparisonType === 'week' ? '30d' : '90d', // Get longer period to extract previous data
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'],
  });

  // Simplified chart without press interactions for now

  // Calculate comparison data between current and previous periods
  const chartData = useMemo(() => {
    if (currentLoading || previousLoading || !currentPeriodLogs || !previousPeriodLogs) {
      return [];
    }

    // Calculate metric value for a set of logs
    const calculateMetricTotal = (logs: typeof currentPeriodLogs) => {
      switch (metricType) {
        case 'calories':
          return logs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
        case 'macros':
          return logs.reduce((sum, log) => 
            sum + (log.protein_consumed || 0) + (log.carbs_consumed || 0) + (log.fat_consumed || 0), 0);
        case 'weight':
          // For weight, we'd need weight entries, not food logs
          // For now, default to calories
          return logs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
        default:
          return logs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
      }
    };

    // Calculate current period average
    const currentTotal = calculateMetricTotal(currentPeriodLogs);
    const currentAvg = currentPeriodLogs.length ? currentTotal / currentPeriodLogs.length : 0;

    // Calculate previous period average - use a better strategy
    const periodDays = comparisonType === 'week' ? 7 : 30;
    
    // Sort all logs by date and take the appropriate slice for previous period
    const sortedPreviousLogs = [...previousPeriodLogs].sort((a, b) => {
      const dateA = a.logged_at ? new Date(a.logged_at).getTime() : 0;
      const dateB = b.logged_at ? new Date(b.logged_at).getTime() : 0;
      return dateA - dateB;
    });

    // Take logs from the period before the current one
    const totalLogs = sortedPreviousLogs.length;
    const previousLogs = sortedPreviousLogs.slice(
      Math.max(0, totalLogs - (periodDays * 2)), 
      totalLogs - periodDays
    );

    const previousTotal = calculateMetricTotal(previousLogs);
    const previousAvg = previousLogs.length ? previousTotal / previousLogs.length : 0;

    // Only return data if we have meaningful data for both periods
    if (currentPeriodLogs.length === 0 && previousLogs.length === 0) {
      return [];
    }

    return [
      {
        period: `Previous ${comparisonType}`,
        value: Math.round(previousAvg),
      },
      {
        period: `Current ${comparisonType}`,
        value: Math.round(currentAvg),
      },
    ];
  }, [currentPeriodLogs, previousPeriodLogs, currentLoading, previousLoading, comparisonType, metricType]);

  const isEmpty = chartData.length === 0 || chartData.every(d => d.value === 0);
  
  const getTitle = () => {
    const periodLabel = comparisonType === 'week' ? 'Weekly' : 'Monthly';
    const metricLabel = metricType === 'calories' ? 'Calories' : 
                       metricType === 'macros' ? 'Macros' : 'Weight';
    return `${periodLabel} ${metricLabel} Comparison`;
  };

  if (isEmpty) {
    return (
      <ChartContainer
        title={getTitle()}
        subtitle="Current vs Previous Period"
        height={height}
      >
        <ChartEmptyState message="Not enough data for period comparison" />
      </ChartContainer>
    );
  }

  const styles = StyleSheet.create({
    chartWrapper: {
      paddingHorizontal: 16,
    },
    summaryContainer: {
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '600',
      color: chartData[1]?.value > chartData[0]?.value ? chartColors.calories.medium : chartColors.calories.high,
    },
  });

  const percentageChange = chartData[0]?.value > 0 
    ? Math.round(((chartData[1]?.value - chartData[0]?.value) / chartData[0]?.value) * 100) 
    : 0;

  return (
    <ChartContainer
      title={getTitle()}
      subtitle="Current vs Previous Period"
      height={height}
      noPadding={false}
    >
      <View style={styles.chartWrapper}>
        <CartesianChart
          data={chartData}
          xKey="period"
          yKeys={["value"]}
          domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.value}
              chartBounds={chartBounds}
              color={chartColors.palette[0]}
              barWidth={60}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
            />
          )}
        </CartesianChart>
      </View>
      
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Change from Previous Period</Text>
        <Text style={styles.summaryValue}>
          {percentageChange > 0 ? '+' : ''}{percentageChange}%
        </Text>
      </View>
    </ChartContainer>
  );
};