import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar, Line, useChartPressState } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface CalorieChartProps {
  days?: number;
  showTarget?: boolean;
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const CalorieChart: React.FC<CalorieChartProps> = ({
  days = 7,
  showTarget = true,
  height = 300,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { foodLogs } = useFoodLogs();

  // Calculate daily calorie target
  const dailyTarget = profile?.target_calories || 2000;

  // Prepare chart data
  const chartData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Generate data for each day in the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date
      const dayLogs = foodLogs?.filter(log => {
        if (!log.created_at) return false;
        const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      }) || [];

      // Calculate total calories for the day
      const totalCalories = dayLogs.reduce((sum, log) => {
        const calories = log.calories_consumed || 0;
        return sum + calories;
      }, 0);

      data.push({
        day: format(date, 'MMM dd'),
        calories: Math.round(totalCalories),
        target: dailyTarget,
        date: date,
        percentage: Math.round((totalCalories / dailyTarget) * 100),
      });
    }

    return data;
  }, [foodLogs, selectedPeriod, dailyTarget]);

  // Chart press state for interactions
  const { state, isActive } = useChartPressState({ 
    x: 0, 
    y: { calories: 0 } 
  });

  // Calculate max Y value for chart domain
  const maxY = useMemo(() => {
    const maxValue = Math.max(...chartData.map(d => d.calories), dailyTarget);
    return Math.ceil(maxValue / 500) * 500; // Round up to nearest 500
  }, [chartData, dailyTarget]);

  const isEmpty = chartData.every(d => d.calories === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Daily Calories"
        subtitle={`Target: ${dailyTarget} cal/day`}
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message="No calorie data available for this period" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.max(screenWidth - 32, 350);

  const styles = StyleSheet.create({
    chartWrapper: {
      paddingHorizontal: 16,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
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

  return (
    <ChartContainer
      title="Daily Calories"
      subtitle={`Target: ${dailyTarget} cal/day`}
      height={height}
      noPadding={true}
      actions={
        <ChartPeriodSelector
          periods={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          <CartesianChart
            data={chartData}
            xKey="day"
            yKeys={["calories"]}
            domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
            chartPressState={state}
          >
            {({ points, chartBounds }) => (
              <>
                {/* Target line */}
                {showTarget && (
                  <Line
                    points={[
                      { x: chartBounds.left, y: chartBounds.top + (chartBounds.height * (1 - dailyTarget / maxY)) },
                      { x: chartBounds.right, y: chartBounds.top + (chartBounds.height * (1 - dailyTarget / maxY)) },
                    ]}
                    color={chartColors.calories.target}
                    strokeWidth={2}
                    pathEffect={{ stroke: { dashArray: [5, 5] } }}
                  />
                )}
                
                {/* Bar chart */}
                <Bar
                  points={points.calories}
                  chartBounds={chartBounds}
                  color={({ datum }) => {
                    const percentage = (datum.calories / dailyTarget) * 100;
                    if (percentage < 90) return chartColors.calories.low;
                    if (percentage <= 110) return chartColors.calories.medium;
                    return chartColors.calories.high;
                  }}
                  barWidth={20}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                />

                {/* Tooltip */}
                {isActive && (
                  <View
                    style={[
                      styles.tooltipContainer,
                      {
                        left: state.x.position - 40,
                        top: state.y.calories.position - 40,
                      },
                    ]}
                  >
                    <Text style={styles.tooltipText}>
                      {chartFormatters.calories(state.y.calories.value)}
                    </Text>
                    <Text style={styles.tooltipText}>
                      {Math.round((state.y.calories.value / dailyTarget) * 100)}% of target
                    </Text>
                  </View>
                )}
              </>
            )}
          </CartesianChart>
        </View>
      </ScrollView>
      
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>
            {chartFormatters.calories(
              chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length
            )}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            {chartFormatters.abbreviateNumber(
              chartData.reduce((sum, d) => sum + d.calories, 0)
            )}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Days on Target</Text>
          <Text style={styles.summaryValue}>
            {chartData.filter(d => d.calories >= dailyTarget * 0.9 && d.calories <= dailyTarget * 1.1).length}
          </Text>
        </View>
      </View>
    </ChartContainer>
  );
};