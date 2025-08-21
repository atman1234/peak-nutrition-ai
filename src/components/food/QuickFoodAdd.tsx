import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { format } from 'date-fns';
import { FoodAutocomplete } from './FoodAutocomplete';
import { PortionPicker } from './PortionPicker';
import { MealTypePicker } from './MealTypePicker';
import { FoodNutritionPreview } from './FoodNutritionPreview';
import { foodLogSchema, FoodLogFormData, getValidationContext } from '../../lib/validation/schemas';
import { z } from 'zod';

interface QuickFoodAddProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultMealType?: MealType;
  showAsFavorite?: boolean;
}

type FormMode = 'basic' | 'advanced';

interface AdvancedFormData extends FoodLogFormData {
  mode: FormMode;
  loggedAt: Date;
  brand?: string;
  ingredients?: string;
  customProtein?: number;
  customCarbs?: number;
  customFat?: number;
  customFiber?: number;
}

export function QuickFoodAdd({ 
  onSuccess, 
  onCancel,
  defaultMealType,
  showAsFavorite = true,
}: QuickFoodAddProps) {
  const [selectedFood, setSelectedFood] = useState<UnifiedFoodResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('basic');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
  } = useForm<AdvancedFormData>({
    resolver: zodResolver(foodLogSchema.extend({
      mode: z.enum(['basic', 'advanced']).default('basic'),
      loggedAt: z.date().default(new Date()),
      brand: z.string().optional(),
      ingredients: z.string().optional(),
      customProtein: z.number().min(0).max(100).optional(),
      customCarbs: z.number().min(0).max(100).optional(),
      customFat: z.number().min(0).max(100).optional(),
      customFiber: z.number().min(0).max(50).optional(),
    })),
    defaultValues: {
      searchTerm: '',
      portion: 100,
      mealType: defaultMealType || validationContext.suggestedMealType,
      addToFavorites: false,
      mode: 'basic',
      loggedAt: new Date(),
      notes: '',
    },
  });

  const watchedValues = watch();
  const portionSuggestions = selectedFood ? [getPortionSuggestion(selectedFood.id, selectedFood.name).suggested_portion] : [];

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      maxHeight: Platform.OS === 'web' ? '100vh' : undefined,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.md,
      gap: Spacing.md,
      paddingBottom: Spacing.xl * 2, // Extra padding for mobile keyboards
      minHeight: Platform.OS === 'web' ? '100%' : undefined,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    mainCard: {
      padding: Spacing.md,
    },
    fieldSection: {
      marginBottom: Spacing.md,
    },
    twoColumnRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    halfField: {
      flex: 1,
    },
    helpText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      fontStyle: 'italic',
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
    modeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Spacing.borderRadius.md,
      marginBottom: Spacing.md,
    },
    modeToggleText: {
      ...TextStyles.bodyLarge,
      color: colors.text,
      fontWeight: '600',
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    dateTimeButton: {
      flex: 1,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      color: colors.text,
      ...TextStyles.body,
      fontSize: 16,
    },
    textInputError: {
      borderColor: colors.error,
    },
    advancedFieldsContainer: {
      gap: Spacing.md,
    },
    macroRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    macroField: {
      flex: 1,
    },
    fieldLabel: {
      ...TextStyles.bodySmall,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    lockButton: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    lockButtonText: {
      ...TextStyles.body,
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    datePickerContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Spacing.borderRadius.lg,
      borderTopRightRadius: Spacing.borderRadius.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    datePickerTitle: {
      ...TextStyles.h4,
      color: colors.text,
    },
    datePickerButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
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

  const onSubmit = async (data: AdvancedFormData) => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food from the search results');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use custom macros if in advanced mode and provided, otherwise calculate from food data
      let nutrition;
      if (formMode === 'advanced' && (data.customProtein || data.customCarbs || data.customFat)) {
        const multiplier = data.portion / 100;
        nutrition = {
          calories: Math.round(((data.customProtein || 0) * 4 + (data.customCarbs || 0) * 4 + (data.customFat || 0) * 9) * multiplier),
          protein: Math.round((data.customProtein || 0) * multiplier * 10) / 10,
          carbs: Math.round((data.customCarbs || 0) * multiplier * 10) / 10,
          fat: Math.round((data.customFat || 0) * multiplier * 10) / 10,
          fiber: data.customFiber ? Math.round(data.customFiber * multiplier * 10) / 10 : undefined,
          sugar: undefined,
          sodium: undefined,
        };
      } else {
        nutrition = calculateNutrition(selectedFood, data.portion);
      }

      // Log the food
      await new Promise<void>((resolve, reject) => {
        addFoodLog({
          food_name: selectedFood.name,
          brand: data.brand || selectedFood.brand || null,
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
          notes: data.notes || null,
          logged_at: data.loggedAt.toISOString(),
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

  const handleModeToggle = (enabled: boolean) => {
    const mode = enabled ? 'advanced' : 'basic';
    setFormMode(mode);
    setValue('mode', mode);
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    // On Android, auto-close on dismiss/cancel
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    // Only update the date if provided, but don't auto-advance or close
    if (selectedDate) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(selectedDate.getHours());
      newDateTime.setMinutes(selectedDate.getMinutes());
      setSelectedDate(newDateTime);
      setValue('loggedAt', newDateTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    // On Android, auto-close on dismiss/cancel
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    // Only update the time if provided, but don't auto-close
    if (selectedTime) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setSelectedDate(newDateTime);
      setValue('loggedAt', newDateTime);
    }
  };

  const handleDatePickerNext = () => {
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleLockInManualEntry = () => {
    if (!watchedValues.searchTerm) {
      Alert.alert('Error', 'Please enter a food name before locking in manual entry');
      return;
    }

    // Create a fake unified food result for manual entry
    const manualFood: UnifiedFoodResult = {
      id: `manual_${Date.now()}`,
      name: watchedValues.searchTerm,
      source: 'manual',
      calories_per_100g: watchedValues.customProtein ? 
        (watchedValues.customProtein * 4) + 
        ((watchedValues.customCarbs || 0) * 4) + 
        ((watchedValues.customFat || 0) * 9) : 100,
      protein_per_100g: watchedValues.customProtein || 0,
      carbs_per_100g: watchedValues.customCarbs || 0,
      fat_per_100g: watchedValues.customFat || 0,
      fiber_per_100g: watchedValues.customFiber || 0,
      brand: watchedValues.brand,
      is_favorite: false,
      ingredients: watchedValues.ingredients ? [watchedValues.ingredients] : undefined,
    };

    setSelectedFood(manualFood);
    Alert.alert('Manual Entry Locked', 'You can now set portion and add this custom food entry');
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
        {/* Single Main Card */}
        <Card style={styles.mainCard}>
          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <Text style={styles.modeToggleText}>
              {formMode === 'basic' ? 'Quick Mode' : 'Advanced Mode'}
            </Text>
            <Controller
              name="mode"
              control={control}
              render={({ field: { value } }) => (
                <Switch
                  value={value === 'advanced'}
                  onValueChange={handleModeToggle}
                  trackColor={{ false: colors.border, true: colors.gold }}
                  thumbColor={colors.surface}
                />
              )}
            />
          </View>

          {/* Search Food */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Food Name</Text>
            <Controller
              name="searchTerm"
              control={control}
              render={({ field: { value } }) => (
                <FoodAutocomplete
                  value={value}
                  onChangeText={handleSearchTermChange}
                  onSelectFood={handleFoodSelect}
                  placeholder="Type food name and press Enter to search..."
                  error={errors.searchTerm?.message}
                />
              )}
            />
          </View>

          {/* Advanced Mode Brand Field */}
          {formMode === 'advanced' && (
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <Controller
                name="brand"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.textInput, errors.brand && styles.textInputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g., 'Kraft', 'Organic Valley'"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              />
            </View>
          )}

          {/* Portion and Calories Row */}
          <View style={styles.twoColumnRow}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Portion (grams)</Text>
              <Controller
                name="portion"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.textInput, errors.portion && styles.textInputError]}
                    value={value?.toString()}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 100)}
                    placeholder="100"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Calories</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary }]}
                value={selectedFood ? calculateNutrition(selectedFood, watchedValues.portion).calories.toString() : '0'}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Meal Type */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Meal Type</Text>
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
          </View>

          {/* Date & Time */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Date & Time (when consumed)</Text>
            <Controller
              name="loggedAt"
              control={control}
              render={({ field: { value } }) => (
                <Button
                  title={format(value || selectedDate, 'MM/dd/yyyy, h:mm a')}
                  variant="outline"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateTimeButton}
                  icon={<Ionicons name="calendar-outline" size={16} color={colors.text} />}
                />
              )}
            />
            <Text style={styles.helpText}>Defaults to current time. Useful for logging past meals or setting specific times.</Text>
          </View>

          {/* Notes */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <Controller
              name="notes"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[
                    styles.textInput,
                    { height: 80, textAlignVertical: 'top' },
                    errors.notes && styles.textInputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Add any notes about this food entry..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                />
              )}
            />
          </View>

          {/* Macros - Show in both modes, but more fields in advanced */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Protein (g)</Text>
            <View style={styles.twoColumnRow}>
              <View style={styles.halfField}>
                <Controller
                  name="customProtein"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      style={[styles.textInput, errors.customProtein && styles.textInputError]}
                      value={value?.toString()}
                      onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Carbs (g)</Text>
                <Controller
                  name="customCarbs"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      style={[styles.textInput, errors.customCarbs && styles.textInputError]}
                      value={value?.toString()}
                      onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            </View>
            <View style={styles.twoColumnRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Fat (g)</Text>
                <Controller
                  name="customFat"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      style={[styles.textInput, errors.customFat && styles.textInputError]}
                      value={value?.toString()}
                      onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              {formMode === 'advanced' && (
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Fiber (g)</Text>
                  <Controller
                    name="customFiber"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        style={[styles.textInput, errors.customFiber && styles.textInputError]}
                        value={value?.toString()}
                        onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Ingredients - Advanced Mode Only */}
          {formMode === 'advanced' && (
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Ingredients (optional)</Text>
              <Controller
                name="ingredients"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[
                      styles.textInput,
                      { height: 100, textAlignVertical: 'top' },
                      errors.ingredients && styles.textInputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="List ingredients separated by commas or new lines (e.g., 1 cup oats, 1 banana, 2 tbsp honey)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                  />
                )}
              />
              <Text style={styles.helpText}>Add ingredients manually. This will be stored as text with your food entry.</Text>
            </View>
          )}

          {/* Manual Entry Lock Button - Advanced Mode Only */}
          {formMode === 'advanced' && !selectedFood && watchedValues.searchTerm && (
            <Button
              title="Lock in Manual Entry"
              variant="outline"
              onPress={handleLockInManualEntry}
              style={styles.lockButton}
              icon={<Ionicons name="lock-closed" size={16} color={colors.text} />}
            />
          )}
        </Card>

        {/* Show nutrition preview and favorites option when food is selected */}
        {selectedFood && (
          <>
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

        {/* Date/Time Picker Modal */}
        {(showDatePicker || showTimePicker) && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker || showTimePicker}
            onRequestClose={() => {
              setShowDatePicker(false);
              setShowTimePicker(false);
            }}
          >
            <TouchableWithoutFeedback onPress={() => {
              setShowDatePicker(false);
              setShowTimePicker(false);
            }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>
                        {showTimePicker ? 'Select Time' : 'Select Date'}
                      </Text>
                      <View style={styles.datePickerButtons}>
                        {showDatePicker && !showTimePicker && (
                          <>
                            <Button
                              title="Cancel"
                              variant="ghost"
                              onPress={handleDatePickerDone}
                            />
                            <Button
                              title="Next"
                              variant="primary"
                              onPress={handleDatePickerNext}
                            />
                          </>
                        )}
                        {showTimePicker && (
                          <>
                            <Button
                              title="Back"
                              variant="ghost"
                              onPress={() => {
                                setShowTimePicker(false);
                                setShowDatePicker(true);
                              }}
                            />
                            <Button
                              title="Done"
                              variant="primary"
                              onPress={handleDatePickerDone}
                            />
                          </>
                        )}
                      </View>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode={showTimePicker ? 'time' : 'date'}
                      display="spinner"
                      onChange={(event, date) => {
                        if (showTimePicker) {
                          handleTimeChange(event, date);
                        } else {
                          handleDateChange(event, date);
                        }
                      }}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
        
        {/* Android date/time picker */}
        {(showDatePicker || showTimePicker) && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode={showTimePicker ? 'time' : 'date'}
            display="default"
            onChange={(event, date) => {
              if (showTimePicker) {
                handleTimeChange(event, date);
              } else {
                handleDateChange(event, date);
                // On Android, after selecting date, show time picker
                if (date && event.type === 'set') {
                  setShowDatePicker(false);
                  setTimeout(() => setShowTimePicker(true), 100);
                }
              }
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}