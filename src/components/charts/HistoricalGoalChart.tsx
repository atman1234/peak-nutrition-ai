import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CartesianChart, Area } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';

interface HistoricalGoalChartProps {
  days?: number;
  goalType?: 'calories' | 'weight' | 'protein';
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

export const HistoricalGoalChart: React.FC<HistoricalGoalChartProps> = ({
  days = 30,
  goalType = 'calories',
  height = 350,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  
  // Use historical analytics for the selected period
  const periodDays = parseInt(selectedPeriod);
  const timePeriod = periodDays <= 7 ? '7d' : periodDays <= 30 ? '30d' : '90d';
  const { foodLogs, isLoading } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: [goalType as 'calories' | 'protein'],
  });

  // Simplified chart without press interactions for now

  // Get goal target
  const goalTarget = useMemo(() => {
    switch (goalType) {
      case 'calories':
        return (profile as any)?.daily_calories || (profile as any)?.target_calories || 2000;
      case 'protein':
        const totalCalories = (profile as any)?.daily_calories || (profile as any)?.target_calories || 2000;
        return Math.round((totalCalories * 0.25) / 4); // 25% protein target
      default:
        return 2000;
    }
  }, [profile, goalType]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (isLoading || !foodLogs) return [];

    const currentPeriodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

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

      let actualValue = 0;
      if (goalType === 'calories') {
        actualValue = dayLogs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
      } else if (goalType === 'protein') {
        actualValue = dayLogs.reduce((sum, log) => sum + (log.protein_consumed || 0), 0);
      }

      const achievementPercentage = goalTarget > 0 ? Math.min(100, (actualValue / goalTarget) * 100) : 0;

      data.push({
        day: format(date, 'MMM dd'),
        achievement: Math.round(achievementPercentage),
        actual: actualValue,
        date: date,
        target: goalTarget,
      });
    }

    return data;
  }, [foodLogs, selectedPeriod, goalType, goalTarget, isLoading]);

  const isEmpty = chartData.every(d => d.achievement === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Goal Achievement"
        subtitle={`${goalType.charAt(0).toUpperCase() + goalType.slice(1)} progress tracking`}
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message={`No ${goalType} data available for goal tracking`} />
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

  // Calculate success metrics
  const successMetrics = useMemo(() => {
    const validDays = chartData.filter(d => d.achievement > 0);
    if (validDays.length === 0) return { daysOnTarget: 0, averageAchievement: 0, streak: 0 };

    const targetThreshold = 80; // 80% achievement threshold
    const daysOnTarget = validDays.filter(d => d.achievement >= targetThreshold).length;
    const averageAchievement = validDays.reduce((sum, d) => sum + d.achievement, 0) / validDays.length;
    
    // Calculate current streak
    let streak = 0;
    for (let i = validDays.length - 1; i >= 0; i--) {
      if (validDays[i].achievement >= targetThreshold) {
        streak++;
      } else {
        break;
      }
    }

    return {
      daysOnTarget,
      averageAchievement: Math.round(averageAchievement),
      streak,
    };
  }, [chartData]);

  return (
    <ChartContainer
      title="Goal Achievement"
      subtitle={`${goalType.charAt(0).toUpperCase() + goalType.slice(1)} progress tracking`}
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
            yKeys={["achievement"]}
            domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
          >
            {({ points }) => (
              <>
                {/* Achievement area */}
                <Area
                  points={points.achievement}
                  y0={0}
                  color={colors.success || chartColors.macros.protein}
                  opacity={0.3}
                />
              </>
            )}
          </CartesianChart>
        </View>
      </ScrollView>
      
      {/* Success Metrics */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Days on Target</Text>
          <Text style={[styles.summaryValue, { color: colors.success || chartColors.macros.protein }]}>
            {successMetrics.daysOnTarget}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>
            {successMetrics.averageAchievement}%
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Current Streak</Text>
          <Text style={[styles.summaryValue, { color: colors.primary || chartColors.calories.target }]}>
            {successMetrics.streak}
          </Text>
        </View>
      </View>
    </ChartContainer>
  );
};