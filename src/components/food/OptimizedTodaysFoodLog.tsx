import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFoodLogs } from '../../hooks/useFoodLogs';
import { MealType, FoodLog } from '../../types/food';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Card, LoadingSpinner } from '../ui';
import { FoodLogEntry } from './FoodLogEntry';

interface OptimizedTodaysFoodLogProps {
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onRefresh?: () => void;
  enableHapticFeedback?: boolean;
  showDailySummary?: boolean;
  collapsedByDefault?: boolean;
}

interface ListItem {
  type: 'header' | 'meal-header' | 'food-entry' | 'summary';
  id: string;
  data: any;
  mealType?: MealType;
}

export function OptimizedTodaysFoodLog({
  onEditEntry,
  onDeleteEntry,
  onRefresh,
  enableHapticFeedback = true,
  showDailySummary = true,
  collapsedByDefault = false,
}: OptimizedTodaysFoodLogProps) {
  const { colors } = useTheme();
  const { foodLogs, dailySummary, isLoading, isRefreshing, refetch } = useFoodLogs();
  
  const [collapsedMeals, setCollapsedMeals] = useState<Set<MealType>>(
    collapsedByDefault ? new Set(['breakfast', 'lunch', 'dinner', 'snack']) : new Set()
  );
  const [showAllDetails, setShowAllDetails] = useState(false);

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

  const calculateMealNutrition = useCallback((mealType: MealType) => {
    const mealFoods = dailySummary.meals[mealType];
    return {
      calories: mealFoods.reduce((sum, food) => sum + (food.calories_consumed || 0), 0),
      protein: mealFoods.reduce((sum, food) => sum + (food.protein_consumed || 0), 0),
      carbs: mealFoods.reduce((sum, food) => sum + (food.carbs_consumed || 0), 0),
      fat: mealFoods.reduce((sum, food) => sum + (food.fat_consumed || 0), 0),
      count: mealFoods.length,
    };
  }, [dailySummary]);

  const toggleMealCollapse = useCallback(async (mealType: MealType) => {
    if (enableHapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setCollapsedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealType)) {
        newSet.delete(mealType);
      } else {
        newSet.add(mealType);
      }
      return newSet;
    });
  }, [enableHapticFeedback]);

  const toggleShowAllDetails = useCallback(async () => {
    if (enableHapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAllDetails(prev => !prev);
  }, [enableHapticFeedback]);

  // Flatten data structure for FlashList
  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];

    // Daily summary header
    if (showDailySummary) {
      items.push({
        type: 'summary',
        id: 'daily-summary',
        data: {
          totalCalories: dailySummary.totalCalories,
          totalProtein: dailySummary.totalProtein,
          totalCarbs: dailySummary.totalCarbs,
          totalFat: dailySummary.totalFat,
          totalEntries: foodLogs.length,
        },
      });
    }

    // Controls header
    items.push({
      type: 'header',
      id: 'controls',
      data: {
        showAllDetails,
        onToggleDetails: toggleShowAllDetails,
      },
    });

    // Process each meal
    mealOrder.forEach(mealType => {
      const mealFoods = dailySummary.meals[mealType];
      if (mealFoods.length === 0) return;

      const mealNutrition = calculateMealNutrition(mealType);
      const isCollapsed = collapsedMeals.has(mealType);

      // Meal header
      items.push({
        type: 'meal-header',
        id: `meal-${mealType}`,
        mealType,
        data: {
          mealType,
          nutrition: mealNutrition,
          isCollapsed,
          onToggle: () => toggleMealCollapse(mealType),
          icon: getMealIcon(mealType),
          color: getMealColor(mealType),
        },
      });

      // Food entries (only if not collapsed)
      if (!isCollapsed) {
        mealFoods.forEach((foodLog, index) => {
          items.push({
            type: 'food-entry',
            id: `${mealType}-${foodLog.id}-${index}`,
            mealType,
            data: {
              foodLog,
              showDetails: showAllDetails,
              onEdit: onEditEntry,
              onDelete: onDeleteEntry,
            },
          });
        });
      }
    });

    return items;
  }, [
    dailySummary, 
    foodLogs,
    collapsedMeals, 
    showAllDetails, 
    calculateMealNutrition,
    toggleMealCollapse,
    toggleShowAllDetails,
    onEditEntry,
    onDeleteEntry,
    showDailySummary,
  ]);

  const renderItem: ListRenderItem<ListItem> = useCallback(({ item }) => {
    switch (item.type) {
      case 'summary':
        return <DailySummaryCard data={item.data} />;
      
      case 'header':
        return <ControlsHeader data={item.data} />;
      
      case 'meal-header':
        return <MealHeader data={item.data} />;
      
      case 'food-entry':
        return <OptimizedFoodEntry data={item.data} />;
      
      default:
        return null;
    }
  }, []);

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh || refetch}
        colors={[colors.primary]}
        tintColor={colors.primary}
      />
    ),
    [isRefreshing, onRefresh, refetch, colors.primary]
  );

  const emptyComponent = useMemo(
    () => (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Ionicons 
          name="restaurant-outline" 
          size={64} 
          color={colors.textTertiary} 
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No food logged today
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Start tracking your meals by adding your first food entry
        </Text>
      </View>
    ),
    [colors]
  );

  if (isLoading && foodLogs.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your food log...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={80}
        refreshControl={refreshControl}
        ListEmptyComponent={emptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listData.length === 0 ? styles.emptyListContent : styles.listContent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

// Memoized sub-components for optimal performance
const DailySummaryCard = React.memo<{ data: any }>(({ data }) => {
  const { colors } = useTheme();
  
  return (
    <Card style={[styles.summaryCard, { backgroundColor: colors.primary + '10' }]}>
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Today's Summary
        </Text>
        <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
          {data.totalEntries} {data.totalEntries === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      
      <View style={styles.summaryNutrition}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(data.totalCalories)}
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
            Calories
          </Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(data.totalProtein)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
            Protein
          </Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(data.totalCarbs)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
            Carbs
          </Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(data.totalFat)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
            Fat
          </Text>
        </View>
      </View>
    </Card>
  );
});

const ControlsHeader = React.memo<{ data: any }>(({ data }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.controlsContainer}>
      <Pressable
        style={styles.toggleButton}
        onPress={data.onToggleDetails}
      >
        <Ionicons 
          name={data.showAllDetails ? 'eye-off-outline' : 'eye-outline'} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={[styles.toggleText, { color: colors.primary }]}>
          {data.showAllDetails ? 'Hide Details' : 'Show All Details'}
        </Text>
      </Pressable>
    </View>
  );
});

const MealHeader = React.memo<{ data: any }>(({ data }) => {
  const { colors } = useTheme();
  
  return (
    <Pressable
      style={[styles.mealHeader, { backgroundColor: data.color + '15' }]}
      onPress={data.onToggle}
    >
      <View style={styles.mealHeaderContent}>
        <View style={styles.mealHeaderLeft}>
          <Ionicons 
            name={data.icon} 
            size={24} 
            color={data.color} 
            style={styles.mealIcon}
          />
          <View>
            <Text style={[styles.mealTitle, { color: colors.text }]}>
              {data.mealType.charAt(0).toUpperCase() + data.mealType.slice(1)}
            </Text>
            <Text style={[styles.mealSubtitle, { color: colors.textSecondary }]}>
              {data.nutrition.count} {data.nutrition.count === 1 ? 'item' : 'items'} • {Math.round(data.nutrition.calories)} cal
            </Text>
          </View>
        </View>
        
        <Ionicons
          name={data.isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
});

const OptimizedFoodEntry = React.memo<{ data: any }>(({ data }) => {
  return (
    <View style={styles.foodEntryContainer}>
      <FoodLogEntry
        foodLog={data.foodLog}
        showDetails={data.showDetails}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...TextStyles.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  summaryCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...TextStyles.h3,
    fontWeight: '600',
  },
  summaryCount: {
    ...TextStyles.caption,
  },
  summaryNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    ...TextStyles.h3,
    fontWeight: '700',
  },
  nutritionLabel: {
    ...TextStyles.caption,
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: Spacing.sm,
  },
  controlsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'flex-end',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  toggleText: {
    ...TextStyles.caption,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  mealHeader: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
  },
  mealHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    marginRight: Spacing.md,
  },
  mealTitle: {
    ...TextStyles.h3,
    fontWeight: '600',
  },
  mealSubtitle: {
    ...TextStyles.caption,
    marginTop: 2,
  },
  foodEntryContainer: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    margin: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...TextStyles.h2,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});