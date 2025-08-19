import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';
import { generateNutritionInsights } from '@/lib/historical-analytics';
import { format, subDays } from 'date-fns';

interface AIReviewTabProps {
  timePeriod?: '7d' | '30d' | '90d';
}

export const AIReviewTab: React.FC<AIReviewTabProps> = ({
  timePeriod = '30d'
}) => {
  const { colors } = useTheme();
  const { dailyAchievements, isLoading } = useHistoricalAnalytics({
    timePeriod,
    includeStreaks: true,
    includeConsistency: true,
    includeTrends: true,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'],
  });

  const insights = useMemo(() => {
    if (!dailyAchievements || dailyAchievements.length === 0) return [];
    return generateNutritionInsights(dailyAchievements);
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
    switch (period) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Recent period';
    }
  };

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Nutrition Analysis</Text>
        <Text style={styles.subtitle}>
          Personalized insights based on your nutrition patterns and goal achievements
        </Text>
        <Text style={styles.periodInfo}>
          Analysis period: {getPeriodLabel(timePeriod)} • {dailyAchievements.length} days of data
        </Text>
      </View>

      {insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data for analysis</Text>
          <Text style={styles.emptySubtext}>
            Keep tracking your nutrition for at least a week to get meaningful AI insights.
          </Text>
        </View>
      ) : (
        insights.map((insight, index) => (
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