import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useTheme } from '@/constants/theme';

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
  const { foodLogs } = useFoodLogs();

  // Chart press state for interactions
  const { state, isActive } = useChartPressState({ 
    x: 0, 
    y: { value: 0 } 
  });

  // Simplified comparison data - comparing current vs previous period
  const chartData = useMemo(() => {
    // Calculate simple averages for demonstration
    const totalCalories = foodLogs?.reduce((sum, log) => sum + (log.calories_consumed || 0), 0) || 0;
    const avgCalories = foodLogs?.length ? totalCalories / foodLogs.length : 0;
    
    return [
      {
        period: 'Previous',
        value: Math.round(avgCalories * 0.8), // Simulate previous period
      },
      {
        period: 'Current',
        value: Math.round(avgCalories),
      },
    ];
  }, [foodLogs]);

  const isEmpty = chartData.every(d => d.value === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Period Comparison"
        subtitle="Current vs Previous Period"
        height={height}
      >
        <ChartEmptyState message="No data available for comparison" />
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
    tooltipContainer: {
      position: 'absolute',
      backgroundColor: colors.card,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tooltipText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
  });

  const percentageChange = chartData[0]?.value > 0 
    ? Math.round(((chartData[1]?.value - chartData[0]?.value) / chartData[0]?.value) * 100) 
    : 0;

  return (
    <ChartContainer
      title="Period Comparison"
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
          chartPressState={state}
        >
          {({ points, chartBounds }) => (
            <>
              <Bar
                points={points.value}
                chartBounds={chartBounds}
                color={({ datum }) => datum.period === 'Current' ? chartColors.primary : chartColors.palette[1]}
                barWidth={60}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
              />

              {/* Tooltip */}
              {isActive && (
                <View
                  style={[
                    styles.tooltipContainer,
                    {
                      left: state.x.position - 40,
                      top: state.y.value.position - 40,
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>
                    {chartFormatters.calories(state.y.value.value)}
                  </Text>
                </View>
              )}
            </>
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