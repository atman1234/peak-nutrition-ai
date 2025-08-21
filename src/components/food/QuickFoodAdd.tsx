import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { useFoodLogs } from '../../hooks/useFoodLogs';
import { useFavorites } from '../../hooks/useFavorites';
import { usePortionHistory } from '../../hooks/usePortionHistory';
import { MealType } from '../../types/food';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Button, Card, LoadingSpinner } from '../ui';
import { FoodAutocomplete } from './FoodAutocomplete';
import { PortionPicker } from './PortionPicker';
import { MealTypePicker } from './MealTypePicker';
import { FoodNutritionPreview } from './FoodNutritionPreview';
import { foodLogSchema, FoodLogFormData, getValidationContext } from '../../lib/validation/schemas';

interface QuickFoodAddProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultMealType?: MealType;
  showAsFavorite?: boolean;
}

export function QuickFoodAdd({ 
  onSuccess, 
  onCancel,
  defaultMealType,
  showAsFavorite = true,
}: QuickFoodAddProps) {
  const [selectedFood, setSelectedFood] = useState<UnifiedFoodResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { colors } = useTheme();
  const { addFoodLog } = useFoodLogs();
  const { addFavorite, isFavorite, canAddMoreFavorites } = useFavorites();
  const { getPortionSuggestion } = usePortionHistory();

  // Get validation context for smart defaults
  const validationContext = getValidationContext();
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FoodLogFormData>({
    resolver: zodResolver(foodLogSchema),
    defaultValues: {
      searchTerm: '',
      portion: 100,
      mealType: defaultMealType || validationContext.suggestedMealType,
      addToFavorites: false,
    },
  });

  const watchedValues = watch();
  const portionSuggestions = selectedFood ? [getPortionSuggestion(selectedFood.id, selectedFood.name).suggested_portion] : [];

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.md,
      gap: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    searchSection: {
      padding: Spacing.md,
    },
    sectionTitle: {
      ...TextStyles.h4,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    favoritesSection: {
      padding: Spacing.md,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    cancelButton: {
      flex: 1,
    },
    submitButton: {
      flex: 2,
    },
  }), [colors]);

  function getCurrentMealType(): MealType {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  }

  const handleFoodSelect = useCallback((food: UnifiedFoodResult) => {
    setSelectedFood(food);
    setValue('searchTerm', food.name);
    
    // Use typical portion if it's a favorite
    if (food.isFavorite && food.id) {
      const suggestion = getPortionSuggestion(food.id, food.name);
      setValue('portion', suggestion.suggested_portion);
    }
  }, [setValue, getPortionSuggestion]);

  const handleSearchTermChange = useCallback((text: string) => {
    setValue('searchTerm', text);
    
    // Clear selected food if user types something different
    setSelectedFood(current => {
      if (current && text !== current.name) {
        return null;
      }
      return current;
    });
  }, [setValue]);

  const calculateNutrition = (food: UnifiedFoodResult, portion: number) => {
    const multiplier = portion / 100;
    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      fiber: food.fiber_per_100g ? Math.round(food.fiber_per_100g * multiplier * 10) / 10 : undefined,
      sugar: food.sugar_per_100g ? Math.round(food.sugar_per_100g * multiplier * 10) / 10 : undefined,
      sodium: food.sodium_per_100g ? Math.round(food.sodium_per_100g * multiplier) : undefined,
    };
  };

  const onSubmit = async (data: FoodLogFormData) => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food from the search results');
      return;
    }

    setIsSubmitting(true);

    try {
      const nutrition = calculateNutrition(selectedFood, data.portion);

      // Log the food
      await new Promise<void>((resolve, reject) => {
        addFoodLog({
          food_name: selectedFood.name,
          brand: selectedFood.brand || null,
          portion_grams: data.portion,
          calories_consumed: nutrition.calories,
          protein_consumed: nutrition.protein,
          carbs_consumed: nutrition.carbs,
          fat_consumed: nutrition.fat,
          fiber_consumed: nutrition.fiber,
          sugar_consumed: nutrition.sugar,
          sodium_consumed: nutrition.sodium,
          meal_type: data.mealType,
          food_item_id: selectedFood.source === 'usda' ? null : selectedFood.id,
        }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });

      // Add to favorites if requested and not already a favorite
      if (data.addToFavorites && !isFavorite(selectedFood.id) && canAddMoreFavorites) {
        try {
          await new Promise<void>((resolve, reject) => {
            addFavorite({
              food_item_id: selectedFood.id,
              typical_portion_grams: data.portion,
            }, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
            });
          });
        } catch (favoriteError) {
          // Don't fail the entire operation if favorite addition fails
          console.warn('Failed to add to favorites:', favoriteError);
        }
      }

      // Reset form and notify success
      reset();
      setSelectedFood(null);
      
      Alert.alert(
        'Success',
        `Added ${selectedFood.name} to your ${data.mealType}!`,
        [{ text: 'OK', onPress: onSuccess }]
      );

    } catch (error) {
      console.error('Error adding food log:', error);
      Alert.alert(
        'Error',
        'Failed to add food to your log. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSelectedFood(null);
    onCancel?.();
  };

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Adding food to your log..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Food</Text>
          <Controller
            name="searchTerm"
            control={control}
            render={({ field: { value } }) => (
              <FoodAutocomplete
                value={value}
                onChangeText={handleSearchTermChange}
                onSelectFood={handleFoodSelect}
                placeholder="Search for food (e.g. 'banana', 'chicken breast')"
                error={errors.searchTerm?.message}
              />
            )}
          />
        </Card>

        {selectedFood && (
          <>
            <Controller
              name="portion"
              control={control}
              render={({ field: { value, onChange } }) => (
                <PortionPicker
                  value={value}
                  onChange={onChange}
                  suggestions={portionSuggestions}
                  foodName={selectedFood.name}
                  error={errors.portion?.message}
                />
              )}
            />

            <Controller
              name="mealType"
              control={control}
              render={({ field: { value, onChange } }) => (
                <MealTypePicker
                  value={value}
                  onChange={onChange}
                  error={errors.mealType?.message}
                />
              )}
            />

            <FoodNutritionPreview
              food={selectedFood}
              portionGrams={watchedValues.portion}
            />

            {showAsFavorite && !isFavorite(selectedFood.id) && canAddMoreFavorites && (
              <Card style={styles.favoritesSection}>
                <Controller
                  name="addToFavorites"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Button
                      title={value ? "Remove from Favorites" : "Add to Favorites"}
                      variant={value ? "outline" : "ghost"}
                      onPress={() => onChange(!value)}
                      icon={
                        <Ionicons 
                          name={value ? "heart" : "heart-outline"} 
                          size={20} 
                          color={value ? colors.crimson : colors.textSecondary} 
                        />
                      }
                    />
                  )}
                />
              </Card>
            )}
          </>
        )}

        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
          />
          
          <Button
            title="Add Food"
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!selectedFood || isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}