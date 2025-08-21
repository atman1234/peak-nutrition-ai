import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CartesianChart, Line, Bar } from 'victory-native';
import { format, subDays, startOfDay, sub } from 'date-fns';
import { useChartColors } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ChartMode = 'line' | 'bar' | 'all';
const { width: screenWidth } = Dimensions.get('window');


interface MacroTrendsChartProps {
  days?: number;
  showTargets?: boolean;
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const MacroTrendsChart: React.FC<MacroTrendsChartProps> = ({
  days = 14,
  height = 350,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  
  // Use historical analytics for the selected period
  const periodDays = parseInt(selectedPeriod);
  const timePeriod = periodDays <= 7 ? '7d' : periodDays <= 30 ? '30d' : '90d';
  const { foodLogs, isLoading } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: false,
    includeConsistency: false,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['protein', 'carbs', 'fat'],
  });

  // Simplified chart without press interactions for now

  // Prepare trend data
  const trendData = useMemo(() => {
    if (isLoading || !foodLogs) return [];

    const currentPeriodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Generate data for each day in the period
    for (let i = currentPeriodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date from historical analytics data
      const dayLogs = foodLogs.filter(log => {
        const timestamp = log.logged_at || log.created_at;
        if (!timestamp) return false;
        const logDate = format(new Date(timestamp), 'yyyy-MM-dd');
        return logDate === dateStr;
      });

      // Calculate total macros for the day
      const totals = dayLogs.reduce((acc, log) => {
        acc.protein += log.protein_consumed || 0;
        acc.carbs += log.carbs_consumed || 0;
        acc.fat += log.fat_consumed || 0;
        return acc;
      }, { protein: 0, carbs: 0, fat: 0 });

      data.push({
        day: format(date, 'MMM dd'),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        date: date,
      });
    }

    return data;
  }, [foodLogs, selectedPeriod, isLoading]);

  // Enhanced analytics with targets and trends
  const { analytics, chartData } = useMemo(() => {
    if (trendData.length === 0) {
      return {
        analytics: {
          averages: { protein: 0, carbs: 0, fat: 0 },
          targets: { protein: 0, carbs: 0, fat: 0 },
          targetRates: { protein: 0, carbs: 0, fat: 0 },
          bestDay: { protein: 0, carbs: 0, fat: 0 },
          trends: { protein: 'stable', carbs: 'stable', fat: 'stable' } as { [key: string]: 'up' | 'down' | 'stable' },
          actualDataDays: 0,
        },
        chartData: [],
      };
    }

    // Calculate targets from profile
    const dailyCalorieTarget = profile?.daily_calorie_target || 2000;
    const targets = {
      protein: profile?.protein_target_g || Math.round(((dailyCalorieTarget * 0.25) / 4)),
      carbs: profile?.carb_target_g || Math.round(((dailyCalorieTarget * 0.50) / 4)),
      fat: profile?.fat_target_g || Math.round(((dailyCalorieTarget * 0.25) / 9)),
    };

    // Get actual data days (excluding days with no macro data)
    const dataWithMacros = trendData.filter(d => d.protein > 0 || d.carbs > 0 || d.fat > 0);
    const actualDataDays = dataWithMacros.length;
    const effectiveDays = Math.max(1, actualDataDays);

    const averages = {
      protein: Math.round(dataWithMacros.reduce((sum, d) => sum + d.protein, 0) / effectiveDays),
      carbs: Math.round(dataWithMacros.reduce((sum, d) => sum + d.carbs, 0) / effectiveDays),
      fat: Math.round(dataWithMacros.reduce((sum, d) => sum + d.fat, 0) / effectiveDays),
    };

    const targetRates = {
      protein: targets.protein > 0 ? Math.round((averages.protein / targets.protein) * 100) : 0,
      carbs: targets.carbs > 0 ? Math.round((averages.carbs / targets.carbs) * 100) : 0,
      fat: targets.fat > 0 ? Math.round((averages.fat / targets.fat) * 100) : 0,
    };

    const bestDay = {
      protein: Math.max(...dataWithMacros.map(d => d.protein)),
      carbs: Math.max(...dataWithMacros.map(d => d.carbs)),
      fat: Math.max(...dataWithMacros.map(d => d.fat)),
    };

    // Simple trend calculation (comparing first half with second half)
    const midPoint = Math.floor(dataWithMacros.length / 2);
    const firstHalf = dataWithMacros.slice(0, midPoint);
    const secondHalf = dataWithMacros.slice(midPoint);
    
    const trends = {
      protein: firstHalf.length && secondHalf.length ? 
        (secondHalf.reduce((s, d) => s + d.protein, 0) / secondHalf.length > firstHalf.reduce((s, d) => s + d.protein, 0) / firstHalf.length ? 'up' : 'down') : 'stable',
      carbs: firstHalf.length && secondHalf.length ?
        (secondHalf.reduce((s, d) => s + d.carbs, 0) / secondHalf.length > firstHalf.reduce((s, d) => s + d.carbs, 0) / firstHalf.length ? 'up' : 'down') : 'stable',
      fat: firstHalf.length && secondHalf.length ?
        (secondHalf.reduce((s, d) => s + d.fat, 0) / secondHalf.length > firstHalf.reduce((s, d) => s + d.fat, 0) / firstHalf.length ? 'up' : 'down') : 'stable',
    };

    // Prepare enhanced chart data with target lines
    const enhancedChartData = trendData.map(item => ({
      ...item,
      proteinTarget: targets.protein,
      carbsTarget: targets.carbs,
      fatTarget: targets.fat,
      day: trendData.length > 14 ? format(item.date, 'M/d') : item.day,
    }));

    return {
      analytics: { averages, targets, targetRates, bestDay, trends, actualDataDays },
      chartData: enhancedChartData,
    };
  }, [trendData, profile]);

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
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
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
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 24,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
  });

  const isEmpty = chartData.every(d => d.protein === 0 && d.carbs === 0 && d.fat === 0);

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="chart-line" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <Text style={styles.title}>Macro Trends</Text>
              <Text style={styles.subtitle}>Daily macro intake over time</Text>
            </View>
          </View>
        </View>
        <ChartEmptyState message="No macro data available for this period" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="chart-line" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>Macro Trends</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>Daily macro intake over time</Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Chart Type</Text>
        <View style={styles.chartTypeSelector}>
          {(['line', 'bar', 'all'] as ChartMode[]).map((type) => (
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
                {type.toUpperCase()}
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
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxisLabels}>
              {(() => {
                const maxMacro = Math.max(
                  Math.max(...chartData.map(d => d.protein)),
                  Math.max(...chartData.map(d => d.carbs)),
                  Math.max(...chartData.map(d => d.fat))
                );
                const ticks = [];
                const tickCount = 4;
                for (let i = 0; i <= tickCount; i++) {
                  const value = Math.round((maxMacro / tickCount) * i);
                  ticks.push(
                    <Text key={i} style={styles.yAxisLabel} numberOfLines={1}>
                      {value}g
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
                yKeys={chartMode === 'all' ? ["protein", "carbs", "fat"] : ["protein"]}
                domainPadding={{ left: 20, right: 20, top: 30, bottom: 60 }}
              >
                {({ points, chartBounds }) => {
                  if (chartMode === 'bar') {
                    return (
                      <>
                        <Bar
                          points={points.protein}
                          chartBounds={chartBounds}
                          color={chartColors.macros.protein}
                          barWidth={Math.max(10, Math.min(30, 240 / chartData.length))}
                          roundedCorners={{ topLeft: 4, topRight: 4 }}
                        />
                        {points.carbs && (
                          <Bar
                            points={points.carbs}
                            chartBounds={chartBounds}
                            color={chartColors.macros.carbs}
                            barWidth={Math.max(10, Math.min(30, 240 / chartData.length))}
                            roundedCorners={{ topLeft: 4, topRight: 4 }}
                          />
                        )}
                        {points.fat && (
                          <Bar
                            points={points.fat}
                            chartBounds={chartBounds}
                            color={chartColors.macros.fat}
                            barWidth={Math.max(10, Math.min(30, 240 / chartData.length))}
                            roundedCorners={{ topLeft: 4, topRight: 4 }}
                          />
                        )}
                      </>
                    );
                  } else {
                    return (
                      <>
                        <Line
                          points={points.protein}
                          color={chartColors.macros.protein}
                          strokeWidth={3}
                          animate={{ type: "timing", duration: 300 }}
                        />
                        {chartMode === 'all' && (
                          <>
                            <Line
                              points={points.carbs}
                              color={chartColors.macros.carbs}
                              strokeWidth={2}
                              animate={{ type: "timing", duration: 300 }}
                            />
                            <Line
                              points={points.fat}
                              color={chartColors.macros.fat}
                              strokeWidth={2}
                              animate={{ type: "timing", duration: 300 }}
                            />
                          </>
                        )}
                      </>
                    );
                  }
                }}
              </CartesianChart>
              
              {/* X-axis labels */}
              <View style={[styles.xAxisLabels, { width: '100%' }]}>
                {chartData.map((item, index) => {
                  let shouldShowLabel = false;
                  let labelText = '';
                  
                  if (chartData.length <= 7) {
                    shouldShowLabel = true;
                    labelText = item.day;
                  } else if (chartData.length <= 14) {
                    shouldShowLabel = index % 2 === 0 || index === chartData.length - 1;
                    labelText = typeof item.day === 'string' ? item.day.substring(0, 3) : item.day;
                  } else {
                    shouldShowLabel = index === 0 || index === chartData.length - 1 || index === Math.floor(chartData.length / 2) || index % 7 === 0;
                    labelText = format(item.date, 'M/d');
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
        ) : (
          <Text style={{ color: colors.text, textAlign: 'center', marginTop: 60 }}>
            No chart data available
          </Text>
        )}
      </View>

      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {analytics.averages.protein}g
          </Text>
          <Text style={styles.analyticsLabel}>Avg Protein</Text>
          <Text style={styles.analyticsSubtext}>{analytics.targetRates.protein}% of target</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {analytics.averages.carbs}g
          </Text>
          <Text style={styles.analyticsLabel}>Avg Carbs</Text>
          <Text style={styles.analyticsSubtext}>{analytics.targetRates.carbs}% of target</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {analytics.averages.fat}g
          </Text>
          <Text style={styles.analyticsLabel}>Avg Fat</Text>
          <Text style={styles.analyticsSubtext}>{analytics.targetRates.fat}% of target</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <View style={styles.trendIndicator}>
            <MaterialCommunityIcons 
              name={analytics.trends.protein === 'up' ? 'trending-up' : analytics.trends.protein === 'down' ? 'trending-down' : 'trending-neutral'} 
              size={16} 
              color={analytics.trends.protein === 'up' ? '#10B981' : analytics.trends.protein === 'down' ? '#EF4444' : colors.textSecondary}
            />
            <Text style={[
              styles.trendText,
              { color: analytics.trends.protein === 'up' ? '#10B981' : analytics.trends.protein === 'down' ? '#EF4444' : colors.textSecondary }
            ]}>
              {analytics.trends.protein === 'up' ? 'Increasing' : analytics.trends.protein === 'down' ? 'Decreasing' : 'Stable'}
            </Text>
          </View>
          <Text style={styles.analyticsLabel}>Protein Trend</Text>
        </View>
      </View>
      
      {/* Color Legend for ALL mode */}
      {chartMode === 'all' && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartColors.macros.protein }]} />
            <Text style={styles.legendText}>Protein</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartColors.macros.carbs }]} />
            <Text style={styles.legendText}>Carbs</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartColors.macros.fat }]} />
            <Text style={styles.legendText}>Fat</Text>
          </View>
        </View>
      )}
    </View>
  );
};