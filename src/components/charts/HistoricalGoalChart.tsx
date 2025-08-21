import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { CartesianChart, Area } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors } from './common/ChartTheme';
import { ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

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
  
  // Use different data sources based on goal type
  const periodDays = parseInt(selectedPeriod);
  const timePeriod = periodDays <= 7 ? '7d' : periodDays <= 30 ? '30d' : '90d';
  
  // For food-related goals, use historical analytics
  const { foodLogs, isLoading: isFoodLoading } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: [goalType as 'calories' | 'protein'],
  });
  
  // For weight goals, use weight entries
  const { weightEntries, isLoading: isWeightLoading } = useWeightEntries();
  
  const isLoading = goalType === 'weight' ? isWeightLoading : isFoodLoading;

  // Simplified chart without press interactions for now

  // Get goal target using correct profile fields
  const goalTarget = useMemo(() => {
    switch (goalType) {
      case 'calories':
        return profile?.daily_calorie_target || 2000;
      case 'protein':
        return profile?.protein_target_g || Math.round(((profile?.daily_calorie_target || 2000) * 0.25) / 4);
      case 'weight':
        return profile?.target_weight || null;
      default:
        return 2000;
    }
  }, [profile, goalType]);

  // Prepare chart data based on goal type
  const chartData = useMemo(() => {
    if (isLoading) return [];

    const currentPeriodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    if (goalType === 'weight' && weightEntries) {
      // Handle weight goal tracking
      for (let i = currentPeriodDays - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Find weight entry for this date
        const weightEntry = weightEntries.find(entry => {
          if (!entry.recorded_at) return false;
          const entryDate = entry.recorded_at.includes('T') 
            ? format(new Date(entry.recorded_at), 'yyyy-MM-dd')
            : entry.recorded_at;
          return entryDate === dateStr;
        });

        const actualWeight = weightEntry ? weightEntry.weight : 0;
        
        // For weight, calculate achievement based on progress toward target
        let achievementPercentage = 0;
        if (goalTarget !== null && profile?.current_weight) {
          const startWeight = profile.current_weight;
          const targetWeight = goalTarget;
          const currentWeight = actualWeight || startWeight;
          
          if (startWeight !== targetWeight) {
            const totalProgress = targetWeight - startWeight;
            const currentProgress = currentWeight - startWeight;
            achievementPercentage = Math.abs((currentProgress / totalProgress) * 100);
          }
        }

        data.push({
          day: format(date, 'MMM dd'),
          achievement: Math.round(Math.min(100, achievementPercentage)),
          actual: actualWeight,
          date: date,
          target: goalTarget || 0,
        });
      }
    } else if (foodLogs) {
      // Handle food-related goal tracking
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

        const achievementPercentage = goalTarget && goalTarget > 0 ? Math.min(100, (actualValue / goalTarget) * 100) : 0;

        data.push({
          day: format(date, 'MMM dd'),
          achievement: Math.round(achievementPercentage),
          actual: actualValue,
          date: date,
          target: goalTarget || 0,
        });
      }
    }

    return data;
  }, [foodLogs, weightEntries, selectedPeriod, goalType, goalTarget, isLoading, profile]);

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
    chartWrapper: {
      paddingHorizontal: 16,
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
      minWidth: '30%',
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

  const isEmpty = chartData.every(d => d.achievement === 0);

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="target" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <Text style={styles.title}>Goal Achievement</Text>
            </View>
          </View>
        </View>
        <ChartEmptyState message={`No ${goalType} data available for goal tracking`} />
      </View>
    );
  }

  // Calculate success metrics based on actual data, not selected period
  const successMetrics = useMemo(() => {
    const validDays = chartData.filter(d => d.achievement > 0);
    if (validDays.length === 0) return { 
      daysOnTarget: 0, 
      averageAchievement: 0, 
      streak: 0,
      actualDataDays: 0,
      selectedPeriodDays: parseInt(selectedPeriod),
      dataCompleteness: 0,
    };

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

    const actualDataDays = validDays.length;
    const selectedPeriodDays = parseInt(selectedPeriod);
    const dataCompleteness = Math.round((actualDataDays / selectedPeriodDays) * 100);

    return {
      daysOnTarget,
      averageAchievement: Math.round(averageAchievement),
      streak,
      actualDataDays,
      selectedPeriodDays,
      dataCompleteness,
    };
  }, [chartData, selectedPeriod]);

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="target" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>Goal Achievement</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>
          {goalType.charAt(0).toUpperCase() + goalType.slice(1)} progress tracking{goalTarget ? ` • Target: ${goalTarget}${goalType === 'weight' ? 'lbs' : goalType === 'calories' ? ' cal' : 'g'}` : ''}
        </Text>
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
      </View>
      
      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: colors.success || chartColors.macros.protein }]}>
            {successMetrics.daysOnTarget}
          </Text>
          <Text style={styles.analyticsLabel}>Days on Target</Text>
          <Text style={styles.analyticsSubtext}>of {successMetrics.actualDataDays} days</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {successMetrics.averageAchievement}%
          </Text>
          <Text style={styles.analyticsLabel}>Average</Text>
          <Text style={styles.analyticsSubtext}>
            {successMetrics.actualDataDays > 0 ? 'actual data' : 'no data'}
          </Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: colors.primary || chartColors.calories.target }]}>
            {successMetrics.streak}
          </Text>
          <Text style={styles.analyticsLabel}>Current Streak</Text>
          <Text style={styles.analyticsSubtext}>consecutive days</Text>
        </View>
      </View>
    </View>
  );
};