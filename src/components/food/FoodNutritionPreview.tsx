import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { Colors, TextStyles, Spacing } from '../../constants';
import { Card } from '../ui';

interface FoodNutritionPreviewProps {
  food: UnifiedFoodResult;
  portionGrams: number;
  showPer100g?: boolean;
}

export function FoodNutritionPreview({ 
  food, 
  portionGrams, 
  showPer100g = false 
}: FoodNutritionPreviewProps) {
  const multiplier = showPer100g ? 1 : portionGrams / 100;
  
  const nutritionData = [
    {
      label: 'Calories',
      value: Math.round(food.calories_per_100g * multiplier),
      unit: '',
      color: Colors.gold,
    },
    {
      label: 'Protein',
      value: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      unit: 'g',
      color: Colors.sage,
    },
    {
      label: 'Carbs',
      value: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      unit: 'g',
      color: Colors.midnight,
    },
    {
      label: 'Fat',
      value: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      unit: 'g',
      color: Colors.crimson,
    },
  ];

  const optionalNutrition = [
    {
      label: 'Fiber',
      value: food.fiber_per_100g ? Math.round(food.fiber_per_100g * multiplier * 10) / 10 : null,
      unit: 'g',
    },
    {
      label: 'Sugar',
      value: food.sugar_per_100g ? Math.round(food.sugar_per_100g * multiplier * 10) / 10 : null,
      unit: 'g',
    },
    {
      label: 'Sodium',
      value: food.sodium_per_100g ? Math.round(food.sodium_per_100g * multiplier) : null,
      unit: 'mg',
    },
  ].filter(item => item.value !== null && item.value !== undefined);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Nutrition Facts
        </Text>
        <Text style={styles.subtitle}>
          {showPer100g ? 'Per 100g' : `Per ${portionGrams}g serving`}
        </Text>
      </View>

      <View style={styles.macrosGrid}>
        {nutritionData.map((item, index) => (
          <View key={item.label} style={styles.macroItem}>
            <View style={[styles.macroIndicator, { backgroundColor: item.color }]} />
            <Text style={styles.macroValue}>
              {item.value}{item.unit}
            </Text>
            <Text style={styles.macroLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {optionalNutrition.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.optionalNutrition}>
            {optionalNutrition.map((item, index) => (
              <View key={item.label} style={styles.optionalItem}>
                <Text style={styles.optionalLabel}>{item.label}</Text>
                <Text style={styles.optionalValue}>
                  {item.value}{item.unit}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {!showPer100g && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Based on {portionGrams}g portion
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...TextStyles.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  macroValue: {
    ...TextStyles.body,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  macroLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  optionalNutrition: {
    gap: Spacing.sm,
  },
  optionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalLabel: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
  optionalValue: {
    ...TextStyles.body,
    color: Colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});