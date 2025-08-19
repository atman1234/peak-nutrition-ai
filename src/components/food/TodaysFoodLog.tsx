import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFoodLogs } from '../../hooks/useFoodLogs';
import { MealType } from '../../types/food';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Card, LoadingSpinner } from '../ui';
import { FoodLogEntry } from './FoodLogEntry';
import { MealSection } from './MealSection';

interface TodaysFoodLogProps {
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

export function TodaysFoodLog({ 
  onEditEntry,
  onDeleteEntry,
}: TodaysFoodLogProps) {
  const { colors } = useTheme();
  const { foodLogs, dailySummary, isLoading } = useFoodLogs();

  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'cafe-outline';
    }
  };

  const getMealColor = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return colors.gold;
      case 'lunch': return colors.sage;
      case 'dinner': return colors.midnight;
      case 'snack': return colors.crimson;
    }
  };

  const calculateMealNutrition = (mealType: MealType) => {
    const mealFoods = dailySummary.meals[mealType];
    return {
      calories: mealFoods.reduce((sum, food) => sum + (food.calories_consumed || 0), 0),
      protein: mealFoods.reduce((sum, food) => sum + (food.protein_consumed || 0), 0),
      carbs: mealFoods.reduce((sum, food) => sum + (food.carbs_consumed || 0), 0),
      fat: mealFoods.reduce((sum, food) => sum + (food.fat_consumed || 0), 0),
      count: mealFoods.length,
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading your food log..." />
      </View>
    );
  }

  if (foodLogs.length === 0) {
    return (
      <Card style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No foods logged today</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking your meals to see your daily nutrition progress
        </Text>
      </Card>
    );
  }

  const renderMealSection = ({ item: mealType }: { item: MealType }) => {
    const mealFoods = dailySummary.meals[mealType];
    const mealNutrition = calculateMealNutrition(mealType);
    
    if (mealFoods.length === 0) {
      return null;
    }

    return (
      <MealSection
        mealType={mealType}
        foods={mealFoods}
        nutrition={mealNutrition}
        icon={getMealIcon(mealType)}
        color={getMealColor(mealType)}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />
    );
  };

  // Create styles with dynamic colors
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    header: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      ...TextStyles.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    totalNutrition: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    totalText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      fontSize: 14,
    },
    listContent: {
      padding: Spacing.md,
      gap: Spacing.md,
    },
    emptyContainer: {
      margin: Spacing.md,
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyTitle: {
      ...TextStyles.h4,
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Food Log</Text>
        <View style={styles.totalNutrition}>
          <Text style={styles.totalText}>
            {Math.round(dailySummary.totalCalories)} calories • {Math.round(dailySummary.totalProtein)}g protein
          </Text>
        </View>
      </View>

      <View style={styles.listContent}>
        {mealOrder.map((mealType) => {
          const component = renderMealSection({ item: mealType });
          return <View key={mealType}>{component}</View>;
        })}
      </View>
    </View>
  );
}

