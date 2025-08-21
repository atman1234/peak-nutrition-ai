import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CartesianChart, Bar, Line, Area, useChartPressState } from 'victory-native';
import { LinearGradient, vec, useFont } from '@shopify/react-native-skia';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';


interface CalorieChartProps {
  days?: number;
  showTarget?: boolean;
  height?: number;
  chartType?: 'bar' | 'line' | 'area';
}

type ChartMode = 'bar' | 'line' | 'pie';

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const CalorieChart: React.FC<CalorieChartProps> = ({
  days = 7,
  height = 300,
  chartType = 'bar',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [chartMode, setChartMode] = useState<ChartMode>('line'); // Default to line to test
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const screenWidth = Dimensions.get('window').width;
  
  // Chart press state for interactions
  const { state, isActive } = useChartPressState({ 
    x: "", 
    y: { calories: 0 } 
  });
  
  // Use historical analytics to get data for the selected period
  const periodDays = parseInt(selectedPeriod);
  const timePeriod = periodDays <= 7 ? '7d' : periodDays <= 30 ? '30d' : '90d';
  const { foodLogs } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories'],
  });

  // Calculate daily calorie target from profile
  const dailyTarget = profile?.daily_calorie_target || 2000;

  // Prepare enhanced chart data with analytics
  const { chartData, analytics } = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];
    let totalCalories = 0;
    let daysOnTarget = 0;
    let bestDay = 0;
    let worstDay = Infinity;
    let streak = 0;
    let currentStreak = 0;

    // Generate data for each day in the period, excluding today (incomplete data)
    // Start from yesterday (i = 1) to avoid incomplete today data
    const startDay = periodDays === 1 ? 0 : 1; // Allow today only if specifically requesting 1 day
    for (let i = periodDays - 1; i >= startDay; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date
      const dayLogs = foodLogs?.filter(log => {
        if (!log.created_at) return false;
        const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      }) || [];

      // Calculate total calories for the day
      const dayCalories = dayLogs.reduce((sum, log) => {
        const calories = log.calories_consumed || 0;
        return sum + calories;
      }, 0);

      const percentage = Math.round((dayCalories / dailyTarget) * 100);
      const isOnTarget = dayCalories >= dailyTarget * 0.85 && dayCalories <= dailyTarget * 1.15;
      const deficit = dailyTarget - dayCalories;
      
      // Update analytics
      totalCalories += dayCalories;
      if (isOnTarget) {
        daysOnTarget++;
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 0;
      }
      
      bestDay = Math.max(bestDay, dayCalories);
      if (dayCalories > 0) worstDay = Math.min(worstDay, dayCalories);

      data.push({
        day: format(date, periodDays <= 7 ? 'E' : 'MMM dd'),
        fullDay: format(date, 'EEEE, MMMM d'),
        calories: Math.round(dayCalories),
        target: dailyTarget,
        date: date,
        percentage,
        isOnTarget,
        deficit: Math.round(deficit),
        surplus: dayCalories > dailyTarget ? Math.round(dayCalories - dailyTarget) : 0,
        color: isOnTarget ? '#10B981' : (dayCalories > dailyTarget ? '#F59E0B' : '#EF4444'),
        alpha: Math.max(0.6, Math.min(1.0, dayCalories / dailyTarget)),
      });
    }

    // Use actual data days instead of selected period for accurate metrics
    // Only count days with actual data (calories > 0)
    const actualDataDays = data.filter(d => d.calories > 0).length;
    const effectiveDays = Math.max(1, actualDataDays); // Avoid division by zero
    
    // Adjust period days to reflect what we're actually showing (excluding today unless specifically 1 day)
    const effectivePeriodDays = periodDays === 1 ? 1 : Math.max(1, periodDays - 1);
    
    const analytics = {
      average: Math.round(totalCalories / effectiveDays),
      total: totalCalories,
      daysOnTarget,
      targetRate: Math.round((daysOnTarget / effectiveDays) * 100),
      bestDay: Math.round(bestDay),
      worstDay: worstDay === Infinity ? 0 : Math.round(worstDay),
      longestStreak: streak,
      currentStreak,
      weeklyAverage: effectiveDays >= 7 ? Math.round(totalCalories / Math.min(7, effectiveDays)) : Math.round(totalCalories / effectiveDays),
      trend: data.length >= 3 ? (data[data.length - 1].calories > data[0].calories ? 'up' : 'down') : 'stable',
      actualDataDays, // Track how many days actually have data
      selectedPeriodDays: periodDays, // Track selected period for display
    };

    return { chartData: data, analytics };
  }, [foodLogs, selectedPeriod, dailyTarget]);

  // Simplified chart without press interactions for now

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
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    analyticsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
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
    analyticsCardSuccess: {
      backgroundColor: '#10B981' + '08',
      borderColor: '#10B981' + '20',
    },
    analyticsCardWarning: {
      backgroundColor: '#F59E0B' + '08',
      borderColor: '#F59E0B' + '20',
    },
    analyticsCardDanger: {
      backgroundColor: '#EF4444' + '08',
      borderColor: '#EF4444' + '20',
    },
    analyticsValue: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    analyticsValueSuccess: {
      color: '#10B981',
    },
    analyticsValueWarning: {
      color: '#F59E0B',
    },
    analyticsValueDanger: {
      color: '#EF4444',
    },
    analyticsValueDefault: {
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
    trendIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    trendText: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    trendTextUp: {
      color: '#10B981',
    },
    trendTextDown: {
      color: '#EF4444',
    },
    trendTextStable: {
      color: colors.textSecondary,
    },
    targetLine: {
      position: 'absolute',
      width: '100%',
      height: 2,
      backgroundColor: colors.primary + '60',
      opacity: 0.8,
    },
    targetLabel: {
      position: 'absolute',
      right: 8,
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: -12,
    },
    targetLabelText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      minWidth: 120,
    },
    tooltipTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    tooltipValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    tooltipTarget: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    tooltipStatus: {
      fontSize: 11,
      fontWeight: '600',
    },
    xAxisLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 8,
      width: '100%',
    },
    xAxisLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
      marginHorizontal: 2,
      minWidth: 24,
    },
    chartContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    yAxisLabels: {
      width: 45,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingRight: 4,
      height: 200,
    },
    yAxisLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'right',
      fontWeight: '500',
      minWidth: 40,
      flexShrink: 0,
    },
    chartArea: {
      flex: 1,
    },
    pieChartContainer: {
      flex: 1,
      padding: 16,
    },
    pieChartTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    pieChartGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 180,
      paddingHorizontal: 12,
    },
    pieChartItem: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 2,
      maxWidth: 50,
    },
    pieChartBarContainer: {
      height: 100,
      width: 20,
      backgroundColor: colors.background,
      borderRadius: 10,
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    pieChartBar: {
      width: '100%',
      borderRadius: 10,
      minHeight: 4,
    },
    pieChartLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      marginBottom: 2,
      textAlign: 'center',
      fontWeight: '500',
    },
    pieChartValue: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 1,
    },
    pieChartPercentage: {
      fontSize: 8,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="chart-bar" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>Daily Calories</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>Target: {dailyTarget} cal/day</Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Chart Type</Text>
        <View style={styles.chartTypeSelector}>
          {(['bar', 'line', 'pie'] as ChartMode[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chartTypeButton,
                chartMode === type && styles.chartTypeButtonActive
              ]}
              onPress={() => setChartMode(type)}
            >
              <Text style={[
                styles.chartTypeButtonText,
                chartMode === type && styles.chartTypeButtonTextActive
              ]}>
                {type === 'pie' ? 'COMPARE' : type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
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

      {/* Chart */}
      <View style={[styles.chartWrapper, { height: 280 }]}>
        {chartData.length > 0 ? (
            <>
              {chartMode === 'pie' ? (
                // Compare chart showing calorie comparison
                <View style={styles.pieChartContainer}>
                  <Text style={styles.pieChartTitle}>Daily Comparison</Text>
                  <View style={styles.pieChartGrid}>
                    {chartData.slice(0, 7).map((item, index) => {
                      const percentage = Math.min(100, (item.calories / dailyTarget) * 100);
                      return (
                        <View key={index} style={styles.pieChartItem}>
                          <View style={styles.pieChartBarContainer}>
                            <View 
                              style={[
                                styles.pieChartBar, 
                                { 
                                  height: Math.max(24, (percentage / 100) * 100),
                                  backgroundColor: item.isOnTarget ? '#10B981' : (item.calories > dailyTarget ? '#F59E0B' : '#EF4444')
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.pieChartLabel} numberOfLines={1}>
                            {chartData.length > 7 ? format(item.date, 'M/d') : item.day}
                          </Text>
                          <Text style={styles.pieChartValue} numberOfLines={1}>
                            {item.calories}
                          </Text>
                          <Text style={styles.pieChartPercentage} numberOfLines={1}>
                            {Math.round(percentage)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.chartContainer}>
                  {/* Y-axis labels */}
                  <View style={styles.yAxisLabels}>
                    {(() => {
                      const maxCalories = Math.max(...chartData.map(d => d.calories), dailyTarget);
                      const ticks = [];
                      const tickCount = 4;
                      for (let i = 0; i <= tickCount; i++) {
                        const value = Math.round((maxCalories / tickCount) * i);
                        ticks.push(
                          <Text key={i} style={styles.yAxisLabel} numberOfLines={1}>
                            {value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
                          </Text>
                        );
                      }
                      return ticks.reverse();
                    })()}
                  </View>
                  
                  {/* Main chart */}
                  <View style={styles.chartArea}>
                    <CartesianChart
                      key={`${chartMode}-${chartData.length}`}
                      data={chartData}
                      xKey="day"
                      yKeys={["calories"]}
                      domainPadding={{ left: 20, right: 20, top: 30, bottom: 60 }}
                    >
                      {({ points, chartBounds }) => {
                        if (chartMode === 'bar') {
                          return (
                            <Bar
                              points={points.calories}
                              chartBounds={chartBounds}
                              color={chartColors.calories.medium}
                              barWidth={Math.max(15, Math.min(40, 300 / chartData.length))}
                              roundedCorners={{ topLeft: 4, topRight: 4 }}
                            />
                          );
                        } else if (chartMode === 'line') {
                          return (
                            <Line
                              points={points.calories}
                              color={chartColors.calories.medium}
                              strokeWidth={3}
                              animate={{ type: "timing", duration: 300 }}
                            />
                          );
                        }
                        return null;
                      }}
                    </CartesianChart>
                    
                    {/* X-axis labels - Smart labeling based on data length */}
                    <View style={[styles.xAxisLabels, { width: '100%' }]}>
                      {chartData.map((item, index) => {
                        // Show labels based on data length for readability
                        let shouldShowLabel = false;
                        let labelText = '';
                        
                        if (chartData.length <= 7) {
                          // Show all labels for 7 days or less
                          shouldShowLabel = true;
                          labelText = item.day;
                        } else if (chartData.length <= 14) {
                          // Show every other label for 8-14 days
                          shouldShowLabel = index % 2 === 0 || index === chartData.length - 1;
                          labelText = item.day.substring(0, 3); // Abbreviate to 3 chars
                        } else {
                          // Show only key labels for 15+ days (first, middle, last, and every 7th)
                          shouldShowLabel = index === 0 || index === chartData.length - 1 || index === Math.floor(chartData.length / 2) || index % 7 === 0;
                          labelText = format(item.date, 'M/d'); // Use short date format
                        }
                        
                        return (
                          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                            {shouldShowLabel && (
                              <Text style={styles.xAxisLabel}>
                                {labelText}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: colors.text, textAlign: 'center', marginTop: 60 }}>
              No chart data available
            </Text>
          )}
      </View>

      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={[
          styles.analyticsCard,
          analytics.targetRate >= 80 ? styles.analyticsCardSuccess :
          analytics.targetRate >= 60 ? styles.analyticsCardWarning : styles.analyticsCardDanger
        ]}>
          <Text style={[
            styles.analyticsValue,
            analytics.targetRate >= 80 ? styles.analyticsValueSuccess :
            analytics.targetRate >= 60 ? styles.analyticsValueWarning : styles.analyticsValueDanger
          ]}>
            {analytics.average}
          </Text>
          <Text style={styles.analyticsLabel}>Daily Average</Text>
          <Text style={styles.analyticsSubtext}>cal/day</Text>
        </View>
        
        <View style={[
          styles.analyticsCard,
          analytics.targetRate >= 80 ? styles.analyticsCardSuccess :
          analytics.targetRate >= 60 ? styles.analyticsCardWarning : styles.analyticsCardDanger
        ]}>
          <Text style={[
            styles.analyticsValue,
            analytics.targetRate >= 80 ? styles.analyticsValueSuccess :
            analytics.targetRate >= 60 ? styles.analyticsValueWarning : styles.analyticsValueDanger
          ]}>
            {analytics.targetRate}%
          </Text>
          <Text style={styles.analyticsLabel}>On Target</Text>
          <Text style={styles.analyticsSubtext}>{analytics.daysOnTarget}/{analytics.actualDataDays} days</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, styles.analyticsValueDefault]}>
            {analytics.longestStreak}
          </Text>
          <Text style={styles.analyticsLabel}>Best Streak</Text>
          <Text style={styles.analyticsSubtext}>consecutive days</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <View style={styles.trendIndicator}>
            <MaterialCommunityIcons 
              name={analytics.trend === 'up' ? 'trending-up' : analytics.trend === 'down' ? 'trending-down' : 'trending-neutral'} 
              size={16} 
              color={analytics.trend === 'up' ? '#10B981' : analytics.trend === 'down' ? '#EF4444' : colors.textSecondary}
            />
            <Text style={[
              styles.trendText,
              analytics.trend === 'up' ? styles.trendTextUp : 
              analytics.trend === 'down' ? styles.trendTextDown : styles.trendTextStable
            ]}>
              {analytics.trend === 'up' ? 'Increasing' : analytics.trend === 'down' ? 'Decreasing' : 'Stable'}
            </Text>
          </View>
          <Text style={styles.analyticsLabel}>Trend</Text>
        </View>
      </View>
      
    </View>
  );
};