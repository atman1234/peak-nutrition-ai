import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');


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

  const getTitle = () => {
    const periodLabel = comparisonType === 'week' ? 'Weekly' : 'Monthly';
    const metricLabel = metricType === 'calories' ? 'Calories' : 
                       metricType === 'macros' ? 'Macros' : 'Weight';
    return `${periodLabel} ${metricLabel} Comparison`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    targetSummary: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    targetText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chartWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    analyticsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 12,
    },
    analyticsCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.background + '60',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    analyticsValue: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
      color: colors.text,
    },
    analyticsLabel: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    analyticsSubtext: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
  });

  const isEmpty = chartData.length === 0 || chartData.every(d => d.value === 0);

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="compare" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <Text style={styles.title}>{getTitle()}</Text>
            </View>
          </View>
        </View>
        <ChartEmptyState message="Not enough data for period comparison" />
      </View>
    );
  }

  const percentageChange = chartData[0]?.value > 0 
    ? Math.round(((chartData[1]?.value - chartData[0]?.value) / chartData[0]?.value) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="compare" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>{getTitle()}</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>Current vs Previous Period</Text>
      </View>

      {/* Chart */}
      <View style={[styles.chartWrapper, { height: 280 }]}>
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
      
      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={[
            styles.analyticsValue,
            { color: percentageChange > 0 ? chartColors.calories.medium : percentageChange < 0 ? chartColors.calories.high : colors.text }
          ]}>
            {percentageChange > 0 ? '+' : ''}{percentageChange}%
          </Text>
          <Text style={styles.analyticsLabel}>Change</Text>
          <Text style={styles.analyticsSubtext}>From Previous Period</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {chartData[1]?.value || 0}
          </Text>
          <Text style={styles.analyticsLabel}>Current</Text>
          <Text style={styles.analyticsSubtext}>{comparisonType === 'week' ? 'This Week' : 'This Month'}</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {chartData[0]?.value || 0}
          </Text>
          <Text style={styles.analyticsLabel}>Previous</Text>
          <Text style={styles.analyticsSubtext}>{comparisonType === 'week' ? 'Last Week' : 'Last Month'}</Text>
        </View>
      </View>
    </View>
  );
};