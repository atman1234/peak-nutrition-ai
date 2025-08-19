import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { generateInsights } from '@/lib/historical-analytics';
import { format } from 'date-fns';
import { ChartPeriodSelector } from '../charts/common/ChartContainer';

interface AIReviewTabProps {
  initialTimePeriod?: '7d' | '30d' | '90d';
}

const periodOptions = [
  { label: 'Today', value: '1' },
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

export const AIReviewTab: React.FC<AIReviewTabProps> = ({
  initialTimePeriod = '30d'
}) => {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(
    initialTimePeriod === '7d' ? '7' : initialTimePeriod === '30d' ? '30' : '90'
  );
  const [refreshing, setRefreshing] = useState(false);
  
  // Map selected period to time period
  const timePeriod = selectedPeriod === '1' ? '7d' : 
                     selectedPeriod === '7' ? '7d' : 
                     selectedPeriod === '30' ? '30d' : '90d';
  
  const { dailyAchievements, isLoading, refetch } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: true,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'],
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refetch) {
      await refetch();
    }
    setRefreshing(false);
  }, [refetch]);

  const insights = useMemo(() => {
    if (!dailyAchievements || dailyAchievements.length === 0) return [];
    // Generate insights needs streaks and consistency data
    const goalTypes = ['calories', 'protein', 'carbs', 'fat'];
    const streaks = goalTypes.map((goalType: any) => ({ goalType, currentStreak: 0, longestStreak: 0 }));
    const consistency = goalTypes.map((goalType: any) => ({ goalType, score: 0 }));
    return generateInsights(streaks as any, consistency as any, dailyAchievements);
  }, [dailyAchievements]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    periodInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    insightIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    insightTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    insightText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      marginBottom: 8,
    },
    recommendationCard: {
      backgroundColor: colors.success + '10',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    recommendationText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing your nutrition patterns...</Text>
      </View>
    );
  }

  if (!dailyAchievements || dailyAchievements.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No nutrition data available</Text>
        <Text style={styles.emptySubtext}>
          Start tracking your meals to get personalized AI insights about your nutrition patterns and habits.
        </Text>
      </View>
    );
  }

  const getPeriodLabel = (period: string) => {
    if (selectedPeriod === '1') return 'Today';
    switch (period) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Recent period';
    }
  };
  
  // Filter insights for today if selected
  const filteredInsights = useMemo(() => {
    if (selectedPeriod === '1' && dailyAchievements && dailyAchievements.length > 0) {
      // For "Today", generate insights from just today's data
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayData = dailyAchievements.filter(d => d.date === today);
      if (todayData.length > 0) {
        const goalTypes = ['calories', 'protein', 'carbs', 'fat'];
        const streaks = goalTypes.map((goalType: any) => ({ goalType, currentStreak: 0, longestStreak: 0 }));
        const consistency = goalTypes.map((goalType: any) => ({ goalType, score: 0 }));
        return generateInsights(streaks as any, consistency as any, todayData);
      }
      return ['No data tracked for today yet. Start logging your meals to see AI insights.'];
    }
    return insights;
  }, [insights, selectedPeriod, dailyAchievements]);

  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes('streak')) return '🔥';
    if (insight.toLowerCase().includes('consistent')) return '✅';
    if (insight.toLowerCase().includes('protein')) return '💪';
    if (insight.toLowerCase().includes('calories')) return '⚡';
    if (insight.toLowerCase().includes('weekend')) return '📅';
    if (insight.toLowerCase().includes('weekday')) return '💼';
    if (insight.toLowerCase().includes('goal')) return '🎯';
    if (insight.toLowerCase().includes('trend')) return '📈';
    if (insight.toLowerCase().includes('attention')) return '⚠️';
    return '🤖';
  };

  const getRecommendation = (insight: string) => {
    if (insight.toLowerCase().includes('attention')) {
      return "Consider meal prepping or setting reminders to stay consistent with your nutrition goals.";
    }
    if (insight.toLowerCase().includes('trending upward')) {
      return "Keep up the excellent progress! Your consistency is paying off.";
    }
    if (insight.toLowerCase().includes('declining')) {
      return "Try identifying any recent changes in routine that might be affecting your nutrition tracking.";
    }
    if (insight.toLowerCase().includes('weekend')) {
      return "Plan your weekend meals in advance to maintain consistency across all days of the week.";
    }
    if (insight.toLowerCase().includes('strong days')) {
      return "Consider what makes these days successful and try to apply those strategies to other days.";
    }
    return "Continue tracking your nutrition consistently for more personalized insights.";
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.title}>AI Nutrition Analysis</Text>
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </View>
        <Text style={styles.subtitle}>
          Personalized insights based on your nutrition patterns and goal achievements
        </Text>
        <Text style={styles.periodInfo}>
          Analysis period: {getPeriodLabel(timePeriod)} • {selectedPeriod === '1' ? '1 day' : `${dailyAchievements?.length || 0} days`} of data
        </Text>
      </View>

      {filteredInsights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data for analysis</Text>
          <Text style={styles.emptySubtext}>
            Keep tracking your nutrition for at least a week to get meaningful AI insights.
          </Text>
        </View>
      ) : (
        filteredInsights.map((insight: string, index: number) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>{getInsightIcon(insight)}</Text>
              <Text style={styles.insightTitle}>Nutrition Insight</Text>
            </View>
            <Text style={styles.insightText}>{insight}</Text>
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationText}>
                💡 {getRecommendation(insight)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};