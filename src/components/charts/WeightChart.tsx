import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CartesianChart, Line, Area, useChartPressState } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface WeightChartProps {
  days?: number;
  showGoal?: boolean;
  chartType?: 'line' | 'area';
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

export const WeightChart: React.FC<WeightChartProps> = ({
  days = 30,
  showGoal = true,
  chartType: initialChartType = 'line',
  height = 300,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [chartType, setChartType] = useState(initialChartType);
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { weightEntries } = useWeightEntries();

  // Get weight goal and units
  const weightGoal = profile?.target_weight || 0;
  const weightUnit = profile?.preferred_units === 'imperial' ? 'lbs' : 'kg';

  // Chart press state for interactions
  const { state, isActive } = useChartPressState({ 
    x: 0, 
    y: { weight: 0 } 
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Sort weight entries by date
    const sortedEntries = [...(weightEntries || [])].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get entries within the period
    const filteredEntries = sortedEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const cutoffDate = subDays(today, periodDays);
      return entryDate >= cutoffDate && entryDate <= today;
    });

    // Convert to chart data format
    filteredEntries.forEach(entry => {
      const weight = weightUnit === 'kg' && entry.weight 
        ? entry.weight * 0.453592 // Convert lbs to kg if needed
        : entry.weight;

      data.push({
        day: format(new Date(entry.date), 'MMM dd'),
        weight: parseFloat(weight.toFixed(1)),
        date: new Date(entry.date),
        goal: weightGoal,
      });
    });

    return data;
  }, [weightEntries, selectedPeriod, weightUnit, weightGoal]);

  const isEmpty = chartData.length === 0;

  if (isEmpty) {
    return (
      <ChartContainer
        title="Weight Progress"
        subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
        height={height}
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2 }}>
              <TouchableOpacity
                onPress={() => setChartType('line')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: chartType === 'line' ? chartColors.weight.actual : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '500',
                  color: chartType === 'line' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  Line
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartType('area')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: chartType === 'area' ? chartColors.weight.actual : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '500',
                  color: chartType === 'area' ? '#FFFFFF' : colors.textSecondary,
                }}>
                  Area
                </Text>
              </TouchableOpacity>
            </View>
            <ChartPeriodSelector
              periods={periodOptions}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </View>
        }
      >
        <ChartEmptyState message="No weight entries for this period" />
      </ChartContainer>
    );
  }

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

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].weight : 0;
  const weightChange = currentWeight - firstWeight;

  return (
    <ChartContainer
      title="Weight Progress"
      subtitle={weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : undefined}
      height={height}
      noPadding={true}
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2 }}>
            <TouchableOpacity
              onPress={() => setChartType('line')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'line' ? chartColors.weight.actual : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'line' ? '#FFFFFF' : colors.textSecondary,
              }}>
                Line
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChartType('area')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'area' ? chartColors.weight.actual : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'area' ? '#FFFFFF' : colors.textSecondary,
              }}>
                Area
              </Text>
            </TouchableOpacity>
          </View>
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </View>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          <CartesianChart
            data={chartData}
            xKey="day"
            yKeys={["weight"]}
            domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
            chartPressState={state}
          >
            {({ points, chartBounds }) => (
              <>
                {/* Goal line */}
                {showGoal && weightGoal > 0 && (
                  <Line
                    points={[
                      { x: chartBounds.left, y: chartBounds.top + (chartBounds.height * 0.5) }, // Simplified goal line
                      { x: chartBounds.right, y: chartBounds.top + (chartBounds.height * 0.5) },
                    ]}
                    color={chartColors.weight.goal}
                    strokeWidth={2}
                    pathEffect={{ stroke: { dashArray: [5, 5] } }}
                  />
                )}
                
                {/* Main Chart */}
                {chartType === 'area' ? (
                  <Area
                    points={points.weight}
                    chartBounds={chartBounds}
                    color={chartColors.weight.actual}
                    opacity={0.3}
                  />
                ) : (
                  <Line
                    points={points.weight}
                    color={chartColors.weight.actual}
                    strokeWidth={2}
                  />
                )}

                {/* Tooltip */}
                {isActive && (
                  <View
                    style={[
                      styles.tooltipContainer,
                      {
                        left: state.x.position - 40,
                        top: state.y.weight.position - 40,
                      },
                    ]}
                  >
                    <Text style={styles.tooltipText}>
                      {chartFormatters.weight(state.y.weight.value, weightUnit)}
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
          <Text style={styles.summaryLabel}>Current</Text>
          <Text style={styles.summaryValue}>
            {chartFormatters.weight(currentWeight, weightUnit)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Change</Text>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: weightChange < 0 ? chartColors.weight.goal : chartColors.calories.high,
          }}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {weightUnit}
          </Text>
        </View>
        {weightGoal > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>To Goal</Text>
            <Text style={styles.summaryValue}>
              {chartFormatters.weight(Math.abs(currentWeight - weightGoal), weightUnit)}
            </Text>
          </View>
        )}
      </View>
    </ChartContainer>
  );
};