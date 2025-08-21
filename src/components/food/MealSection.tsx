import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealType } from '../../types/food';
import type { Tables } from '../../types/supabase';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Card } from '../ui';
import { FoodLogEntry } from './FoodLogEntry';

type FoodLog = Tables<'food_logs'>;

interface MealSectionProps {
  mealType: MealType;
  foods: FoodLog[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  };
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  showExpandedDetails?: boolean;
}

export function MealSection({
  mealType,
  foods,
  nutrition,
  icon,
  color,
  onEditEntry,
  onDeleteEntry,
  showExpandedDetails = false,
}: MealSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { colors } = useTheme();

  const getMealDisplayName = (meal: MealType) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    mealInfo: {
      flex: 1,
    },
    mealName: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    mealStats: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    headerRight: {
      alignItems: 'flex-end',
      gap: Spacing.xs,
    },
    nutritionSummary: {
      alignItems: 'flex-end',
    },
    proteinText: {
      ...TextStyles.caption,
      color: colors.sage,
      fontWeight: '600',
    },
    content: {
      backgroundColor: colors.backgroundSecondary,
    },
    macroBreakdown: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    macroItem: {
      alignItems: 'center',
    },
    macroValue: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    macroLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 11,
    },
    foodsList: {
      paddingVertical: Spacing.sm,
    },
  }), [colors]);

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons
              name={icon}
              size={20}
              color={colors.surface}
            />
          </View>
          
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>
              {getMealDisplayName(mealType)}
            </Text>
            <Text style={styles.mealStats}>
              {nutrition.count} {nutrition.count === 1 ? 'item' : 'items'} • {Math.round(nutrition.calories)} cal
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.nutritionSummary}>
            <Text style={styles.proteinText}>
              {Math.round(nutrition.protein)}g protein
            </Text>
          </View>
          
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {foods.length > 0 && (
            <View style={styles.macroBreakdown}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.carbs)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.protein)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.fat)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          )}

          <View style={styles.foodsList}>
            {foods.map((food, index) => (
              <FoodLogEntry
                key={food.id}
                food={food}
                onEdit={onEditEntry ? () => onEditEntry(food.id) : undefined}
                onDelete={onDeleteEntry ? () => onDeleteEntry(food.id) : undefined}
                isLast={index === foods.length - 1}
                showExpandedByDefault={showExpandedDetails}
              />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}