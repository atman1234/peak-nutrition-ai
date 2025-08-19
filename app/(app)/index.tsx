import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useAuthContext } from '../../src/components/auth/AuthContext';
import { useFoodLogs } from '../../src/hooks/useFoodLogs';
import { useProfile } from '../../src/hooks/useProfile';
import { useWeightEntries } from '../../src/hooks/useWeightEntries';
import { StatCard, LoadingSpinner, Button } from '../../src/components/ui';
import { TodaysFoodLog } from '../../src/components/food';
import { useTheme, TextStyles, Spacing } from '../../src/constants';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const { profile } = useProfile();
  const { dailySummary, foodLogs, isLoading: foodLogsLoading, refetch } = useFoodLogs();
  const { latestWeight, isLoading: weightLoading } = useWeightEntries();
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Calculate derived values
  const calorieTarget = profile?.daily_calorie_target || 2000;
  const caloriesConsumed = dailySummary?.totalCalories || 0;
  const caloriesRemaining = calorieTarget - caloriesConsumed;
  const proteinConsumed = dailySummary?.totalProtein || 0;
  const proteinTarget = Math.round((calorieTarget * 0.3) / 4); // 30% of calories from protein
  
  // Calculate meals logged
  const mealsLogged = foodLogs?.length || 0;
  
  // Weight data
  const currentWeight = latestWeight?.weight || profile?.current_weight || 0;
  const weightUnit = profile?.preferred_units === 'imperial' ? 'lbs' : 'kg';
  
  // Debug logging
  console.log('Dashboard data:', {
    foodLogsCount: foodLogs?.length,
    mealsLogged,
    caloriesConsumed,
    currentWeight,
    latestWeight: latestWeight?.weight,
    profileWeight: profile?.current_weight,
    weightUnit,
    preferredUnits: profile?.preferred_units,
    firstName: profile?.first_name,
    profile: !!profile
  });
  
  // Progress percentage for visual feedback
  const calorieProgress = Math.round((caloriesConsumed / calorieTarget) * 100);

  // Create styles with dynamic colors
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.padding.screen,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    greeting: {
      ...TextStyles.h2,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...TextStyles.body,
      color: colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -Spacing.sm,
      marginBottom: Spacing.xl,
    },
    statCard: {
      width: '48%',
      marginHorizontal: Spacing.sm,
      marginBottom: Spacing.md,
    },
    quickActions: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...TextStyles.h4,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    foodLogSection: {
      marginTop: Spacing.md,
    },
  }), [colors]);

  if (foodLogsLoading && !refreshing) {
    return <LoadingSpinner fullscreen text="Loading your dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.first_name || user?.email?.split('@')[0] || 'there'}!
        </Text>
        <Text style={styles.subtitle}>Here's your daily progress</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Calories Today"
          value={caloriesConsumed}
          subtitle={`of ${calorieTarget} goal (${caloriesRemaining > 0 ? caloriesRemaining : 0} left)`}
          icon="restaurant"
          iconColor={colors.gold}
          trend={calorieProgress > 100 ? 'up' : calorieProgress > 50 ? 'neutral' : 'down'}
          trendValue={`${calorieProgress}%`}
          style={styles.statCard}
        />

        <StatCard
          title="Protein"
          value={`${proteinConsumed}g`}
          subtitle={`of ${proteinTarget}g target`}
          icon="fitness"
          iconColor={colors.sage}
          style={styles.statCard}
        />

        <StatCard
          title="Meals Logged"
          value={mealsLogged}
          subtitle="today"
          icon="checkmark-circle"
          iconColor={colors.sage}
          style={styles.statCard}
        />

        <StatCard
          title="Weight"
          value={currentWeight > 0 ? `${currentWeight} ${weightUnit}` : 'Not set'}
          subtitle={latestWeight?.recorded_at ? new Date(latestWeight.recorded_at).toLocaleDateString() : 'No recent data'}
          icon="fitness"
          iconColor={colors.crimson}
          style={styles.statCard}
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <Button
            title="Log Food"
            onPress={() => router.push('/food')}
            variant="primary"
            style={styles.actionButton}
          />
          
          <Button
            title="Log Weight"
            onPress={() => router.push('/profile')} // This will be updated when we have a weight logging screen
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title="View Analytics"
            onPress={() => router.push('/analytics')}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title="Food History"
            onPress={() => router.push('/food/history')}
            variant="ghost"
            style={styles.actionButton}
          />
        </View>
      </View>

      {mealsLogged > 0 && (
        <View style={styles.foodLogSection}>
          <TodaysFoodLog />
        </View>
      )}
    </ScrollView>
  );
}

