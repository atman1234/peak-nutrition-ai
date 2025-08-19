import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealType } from '../../types/food';
import { Colors, TextStyles, Spacing } from '../../constants';
import { Card } from '../ui';

interface MealTypePickerProps {
  value: MealType | null;
  onChange: (mealType: MealType) => void;
  error?: string;
}

const MEAL_TYPES: Array<{
  value: MealType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}> = [
  {
    value: 'breakfast',
    label: 'Breakfast',
    icon: 'sunny-outline',
    color: Colors.gold,
    description: 'Morning meal',
  },
  {
    value: 'lunch',
    label: 'Lunch',
    icon: 'restaurant-outline',
    color: Colors.sage,
    description: 'Midday meal',
  },
  {
    value: 'dinner',
    label: 'Dinner',
    icon: 'moon-outline',
    color: Colors.midnight,
    description: 'Evening meal',
  },
  {
    value: 'snack',
    label: 'Snack',
    icon: 'cafe-outline',
    color: Colors.crimson,
    description: 'Between meals',
  },
];

export function MealTypePicker({ value, onChange, error }: MealTypePickerProps) {
  const getCurrentTimeBasedSuggestion = (): MealType => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  };

  const suggestedMeal = getCurrentTimeBasedSuggestion();

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Type</Text>
        {!value && (
          <Text style={styles.suggestion}>
            Suggested: {MEAL_TYPES.find(m => m.value === suggestedMeal)?.label}
          </Text>
        )}
      </View>

      <View style={styles.mealGrid}>
        {MEAL_TYPES.map((meal) => {
          const isSelected = value === meal.value;
          const isSuggested = meal.value === suggestedMeal && !value;
          
          return (
            <TouchableOpacity
              key={meal.value}
              style={[
                styles.mealOption,
                isSelected && styles.mealOptionSelected,
                isSuggested && styles.mealOptionSuggested,
              ]}
              onPress={() => onChange(meal.value)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? meal.color : Colors.backgroundSecondary },
              ]}>
                <Ionicons
                  name={meal.icon}
                  size={24}
                  color={isSelected ? Colors.surface : meal.color}
                />
              </View>
              
              <Text style={[
                styles.mealLabel,
                isSelected && styles.mealLabelSelected,
              ]}>
                {meal.label}
              </Text>
              
              <Text style={[
                styles.mealDescription,
                isSelected && styles.mealDescriptionSelected,
              ]}>
                {meal.description}
              </Text>

              {isSuggested && !value && (
                <View style={styles.suggestionBadge}>
                  <Text style={styles.suggestionBadgeText}>Suggested</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
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
  suggestion: {
    ...TextStyles.caption,
    color: Colors.sage,
    fontWeight: '500',
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  mealOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  mealOptionSelected: {
    borderColor: Colors.gold,
    backgroundColor: `${Colors.gold}08`, // Very light gold tint
  },
  mealOptionSuggested: {
    borderColor: Colors.sage,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  mealLabel: {
    ...TextStyles.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  mealLabelSelected: {
    color: Colors.gold,
  },
  mealDescription: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mealDescriptionSelected: {
    color: Colors.textSecondary,
  },
  suggestionBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.sage,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  suggestionBadgeText: {
    ...TextStyles.caption,
    color: Colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.crimson,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});