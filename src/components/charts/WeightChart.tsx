import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CartesianChart, Line, Area, useChartPressState } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface WeightChartProps {
  days?: number;
  showGoal?: boolean;
  chartType?: 'line' | 'area' | 'table';
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
    const data: Array<{
      day: string;
      weight: number;
      date: Date;
      goal: number;
    }> = [];

    // Sort weight entries by recorded_at date
    const sortedEntries = [...(weightEntries || [])].sort((a, b) => {
      const dateA = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const dateB = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return dateA - dateB;
    });

    // Get entries within the period
    const filteredEntries = sortedEntries.filter(entry => {
      if (!entry.recorded_at) return false;
      const entryDate = new Date(entry.recorded_at);
      const cutoffDate = subDays(today, periodDays);
      return entryDate >= cutoffDate && entryDate <= today;
    });

    // Convert to chart data format
    filteredEntries.forEach(entry => {
      const weight = weightUnit === 'kg' && entry.weight 
        ? entry.weight * 0.453592 // Convert lbs to kg if needed
        : entry.weight;

      if (entry.recorded_at) {
        data.push({
          day: format(new Date(entry.recorded_at), 'MMM dd'),
          weight: parseFloat(weight.toFixed(1)),
          date: new Date(entry.recorded_at),
          goal: weightGoal,
        });
      }
    });

    return data;
  }, [weightEntries, selectedPeriod, weightUnit, weightGoal]);

  const isEmpty = chartData.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="scale" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <Text style={styles.title}>Weight Progress</Text>
            </View>
          </View>
        </View>
        <ChartEmptyState message="No weight entries for this period" />
      </View>
    );
  }

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
    controlsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    controlLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chartTypeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartTypeButton: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    chartTypeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chartTypeButtonTextActive: {
      color: colors.card,
    },
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
    // Table Mode Styles
    tableContainer: {
      paddingHorizontal: 8,
      paddingVertical: 16,
      backgroundColor: colors.card,
      minHeight: 380,
      borderRadius: 12,
      marginHorizontal: 4,
      width: screenWidth - 16,
      alignSelf: 'center',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 16,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      marginBottom: 12,
      backgroundColor: colors.primary + '08',
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    tableHeaderText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      backgroundColor: colors.background + '15',
      marginVertical: 4,
      minHeight: 70,
      borderRadius: 12,
    },
    tableCellText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    tableValueText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
  });

  // Calculate enhanced stats with trends and goals
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentWeight: 0,
        firstWeight: 0,
        weightChange: 0,
        actualDataDays: 0,
        selectedPeriodDays: parseInt(selectedPeriod),
        dataCompleteness: 0,
        weeklyTrend: 0,
        progressToGoal: 0,
        isOnTrack: false,
        daysToGoal: 0,
      };
    }
    
    const currentWeight = chartData[chartData.length - 1].weight;
    const firstWeight = chartData[0].weight;
    const weightChange = currentWeight - firstWeight;
    const actualDataDays = chartData.length;
    const selectedPeriodDays = parseInt(selectedPeriod);
    const dataCompleteness = Math.round((actualDataDays / selectedPeriodDays) * 100);
    
    // Calculate weekly trend (7-day moving average change)
    let weeklyTrend = 0;
    if (chartData.length >= 7) {
      const recent7Days = chartData.slice(-7);
      const older7Days = chartData.slice(-14, -7);
      if (older7Days.length > 0) {
        const recentAvg = recent7Days.reduce((sum, d) => sum + d.weight, 0) / recent7Days.length;
        const olderAvg = older7Days.reduce((sum, d) => sum + d.weight, 0) / older7Days.length;
        weeklyTrend = recentAvg - olderAvg;
      }
    }
    
    // Calculate progress to goal
    let progressToGoal = 0;
    let isOnTrack = false;
    let daysToGoal = 0;
    
    if (weightGoal && weightGoal > 0) {
      const totalDistance = Math.abs(firstWeight - weightGoal);
      const currentProgress = Math.abs(firstWeight - currentWeight);
      progressToGoal = totalDistance > 0 ? Math.min(100, (currentProgress / totalDistance) * 100) : 0;
      
      // Determine if on track (moving in right direction)
      const isLosingWeight = firstWeight > weightGoal;
      isOnTrack = isLosingWeight ? weightChange < 0 : weightChange > 0;
      
      // Estimate days to goal based on current trend
      if (weeklyTrend !== 0) {
        const remainingWeight = Math.abs(currentWeight - weightGoal);
        const weeklyRate = Math.abs(weeklyTrend);
        const weeksToGoal = remainingWeight / weeklyRate;
        daysToGoal = Math.round(weeksToGoal * 7);
      }
    }
    
    return {
      currentWeight,
      firstWeight,
      weightChange,
      actualDataDays,
      selectedPeriodDays,
      dataCompleteness,
      weeklyTrend,
      progressToGoal,
      isOnTrack,
      daysToGoal,
    };
  }, [chartData, selectedPeriod, weightGoal]);

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="scale" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>Weight Progress</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>
          {weightGoal ? `Goal: ${chartFormatters.weight(weightGoal, weightUnit)}` : 'Track your weight progress'}
        </Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Chart Type</Text>
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            onPress={() => setChartType('line')}
            style={[
              styles.chartTypeButton,
              chartType === 'line' && styles.chartTypeButtonActive
            ]}
          >
            <Text style={[
              styles.chartTypeButtonText,
              chartType === 'line' && styles.chartTypeButtonTextActive
            ]}>
              LINE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartType('area')}
            style={[
              styles.chartTypeButton,
              chartType === 'area' && styles.chartTypeButtonActive
            ]}
          >
            <Text style={[
              styles.chartTypeButtonText,
              chartType === 'area' && styles.chartTypeButtonTextActive
            ]}>
              AREA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartType('table')}
            style={[
              styles.chartTypeButton,
              chartType === 'table' && styles.chartTypeButtonActive
            ]}
          >
            <Text style={[
              styles.chartTypeButtonText,
              chartType === 'table' && styles.chartTypeButtonTextActive
            ]}>
              TABLE
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Time Period</Text>
        <ChartPeriodSelector
          periods={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </View>
      {chartType === 'table' ? (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={{ flex: 2, paddingLeft: 12 }}>
              <Text style={[styles.tableHeaderText, { textAlign: 'left' }]}>Date</Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.tableHeaderText}>Weight</Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.tableHeaderText}>Change</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tableHeaderText}>To Goal</Text>
            </View>
          </View>
          
          {chartData && chartData.length > 0 ? (
            <>
              {chartData.slice(0, 10).map((item, index) => {
                const prevWeight = index > 0 ? chartData[index - 1].weight : item.weight;
                const change = item.weight - prevWeight;
                const toGoal = weightGoal ? Math.abs(item.weight - weightGoal) : 0;
                
                return (
                  <View key={`${item.day}-${index}`} style={styles.tableRow}>
                    <View style={{ flex: 2, paddingLeft: 12 }}>
                      <Text style={styles.tableCellText}>{item.day}</Text>
                    </View>
                    <View style={{ flex: 1.5, alignItems: 'center' }}>
                      <Text style={styles.tableValueText}>{item.weight.toFixed(1)} {weightUnit}</Text>
                    </View>
                    <View style={{ flex: 1.5, alignItems: 'center' }}>
                      <Text style={[
                        styles.tableValueText,
                        { color: change > 0 ? '#EF4444' : change < 0 ? '#10B981' : colors.textSecondary }
                      ]}>
                        {index > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}` : '—'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.tableValueText}>
                        {weightGoal ? `${toGoal.toFixed(1)}` : '—'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                No weight data available
              </Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartWrapper}>
            <CartesianChart
              data={chartData}
              xKey="day"
              yKeys={["weight"]}
              domainPadding={{ left: 80, right: 80, top: 40, bottom: 60 }}
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
      )}
      
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Current</Text>
          <Text style={styles.summaryValue}>
            {chartFormatters.weight(stats.currentWeight, weightUnit)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Change</Text>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: stats.weightChange < 0 ? chartColors.weight.goal : chartColors.calories.high,
          }}>
            {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} {weightUnit}
          </Text>
          <Text style={[styles.summaryLabel, { fontSize: 10, marginTop: 2 }]}>
            {stats.actualDataDays} entries
          </Text>
        </View>
        {weightGoal > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>To Goal</Text>
            <Text style={styles.summaryValue}>
              {chartFormatters.weight(Math.abs(stats.currentWeight - weightGoal), weightUnit)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};