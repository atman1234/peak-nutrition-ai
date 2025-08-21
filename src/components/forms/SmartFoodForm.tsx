import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormSelect, FormDatePicker, FormTextArea, SelectOption } from './';
import { KeyboardAwareView, Button } from '../ui';
import { ValidationFeedback } from './ValidationFeedback';
import { customFoodSchema, CustomFoodFormData } from '../../lib/validation/schemas';
import { Colors, Spacing, TextStyles } from '../../constants';
import { 
  useAdvancedValidation, 
  createNutritionValidationRules,
  createCrossFieldValidation,
} from '../../hooks/useAdvancedValidation';

interface SmartFoodFormProps {
  onSubmit: (data: CustomFoodFormData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<CustomFoodFormData>;
  isLoading?: boolean;
}

const sourceOptions: SelectOption[] = [
  {
    value: 'usda',
    label: 'USDA Database',
    description: 'Official nutrition database',
    icon: 'library-outline',
  },
  {
    value: 'verified',
    label: 'Verified Source',
    description: 'Manually verified nutrition facts',
    icon: 'checkmark-circle-outline',
  },
  {
    value: 'user_input',
    label: 'User Input',
    description: 'Manually entered data',
    icon: 'person-outline',
  },
  {
    value: 'ai_estimate',
    label: 'AI Estimate',
    description: 'AI-generated nutrition estimate',
    icon: 'bulb-outline',
  },
];

export function SmartFoodForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isLoading = false,
}: SmartFoodFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CustomFoodFormData>({
    resolver: zodResolver(customFoodSchema),
    defaultValues: {
      name: '',
      brand: '',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      sugarPer100g: 0,
      source: 'user_input',
      ...defaultValues,
    },
    mode: 'onChange',
  });

  // Create advanced validation rules
  const validationRules = useMemo(() => [
    ...createNutritionValidationRules(),
    
    // Custom cross-field validation
    createCrossFieldValidation(
      'caloriesPer100g',
      ['proteinPer100g', 'carbsPer100g', 'fatPer100g'],
      (calories, { proteinPer100g, carbsPer100g, fatPer100g }) => {
        if (!calories) return true;
        
        const calculatedCalories = 
          (proteinPer100g || 0) * 4 + 
          (carbsPer100g || 0) * 4 + 
          (fatPer100g || 0) * 9;
        
        const tolerance = 0.15; // 15% tolerance
        return Math.abs(calories - calculatedCalories) <= calculatedCalories * tolerance;
      },
      'Calories should match macronutrient breakdown (±15%)',
      'warning'
    ),

    // Fiber validation
    createCrossFieldValidation(
      'fiberPer100g',
      ['carbsPer100g'],
      (fiber, { carbsPer100g }) => {
        if (!fiber || !carbsPer100g) return true;
        return fiber <= carbsPer100g; // Fiber is part of carbs
      },
      'Fiber cannot exceed total carbohydrates',
      'error'
    ),

    // Sugar validation
    createCrossFieldValidation(
      'sugarPer100g',
      ['carbsPer100g'],
      (sugar, { carbsPer100g }) => {
        if (!sugar || !carbsPer100g) return true;
        return sugar <= carbsPer100g; // Sugar is part of carbs
      },
      'Sugar cannot exceed total carbohydrates',
      'error'
    ),

    // Realistic calorie range
    {
      name: 'caloriesPer100g',
      validate: (calories: number) => {
        if (!calories) return true;
        return calories >= 0 && calories <= 900; // Max possible is ~900 for pure fat
      },
      message: 'Calories per 100g should be between 0 and 900',
      severity: 'error' as const,
    },

    // Source-based validation
    {
      name: 'source',
      validate: (source: string, values: any) => {
        if (source === 'ai_estimate' && !values.name?.trim()) {
          return false;
        }
        return true;
      },
      message: 'AI estimates require a food name',
      severity: 'warning' as const,
      dependsOn: ['name'],
    },
  ], []);

  const validation = useAdvancedValidation({
    watch,
    rules: validationRules,
    errors,
  });

  const watchedValues = watch();
  const totalMacros = (watchedValues.proteinPer100g || 0) + 
                     (watchedValues.carbsPer100g || 0) + 
                     (watchedValues.fatPer100g || 0);

  return (
    <KeyboardAwareView
      style={styles.container}
      contentContainerStyle={styles.content}
      dismissKeyboardOnTap={true}
      enableAutomaticScroll={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Add Custom Food</Text>
        <Text style={styles.subtitle}>
          Enter nutrition information for a custom food item
        </Text>
      </View>

      <ValidationFeedback validation={validation} showScore={true} />

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <FormField
            control={control}
            name="name"
            label="Food Name"
            placeholder="e.g., Homemade Pizza"
            required={true}
            returnKeyType="next"
            autoCapitalize="words"
            helperText="Enter a descriptive name for this food"
          />

          <FormField
            control={control}
            name="brand"
            label="Brand"
            placeholder="e.g., Homemade, Brand Name"
            returnKeyType="next"
            autoCapitalize="words"
            helperText="Optional: Brand or source of this food"
          />

          <FormSelect
            control={control}
            name="source"
            label="Data Source"
            options={sourceOptions}
            helperText="How was this nutrition data obtained?"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Facts (per 100g)</Text>
          
          <FormField
            control={control}
            name="caloriesPer100g"
            label="Calories"
            placeholder="250"
            keyboardType="numeric"
            required={true}
            returnKeyType="next"
            leftIcon="flash-outline"
            helperText="Total calories per 100 grams"
          />

          <View style={styles.macroRow}>
            <FormField
              control={control}
              name="proteinPer100g"
              label="Protein (g)"
              placeholder="10"
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.macroField}
            />

            <FormField
              control={control}
              name="carbsPer100g"
              label="Carbs (g)"
              placeholder="30"
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.macroField}
            />

            <FormField
              control={control}
              name="fatPer100g"
              label="Fat (g)"
              placeholder="8"
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.macroField}
            />
          </View>

          {totalMacros > 0 && (
            <View style={styles.macroSummary}>
              <Text style={styles.macroSummaryText}>
                Total macros: {totalMacros.toFixed(1)}g / 100g
              </Text>
              {totalMacros > 100 && (
                <Text style={styles.macroWarning}>
                  ⚠️ Total exceeds 100g - please verify values
                </Text>
              )}
            </View>
          )}

          <View style={styles.detailedRow}>
            <FormField
              control={control}
              name="fiberPer100g"
              label="Fiber (g)"
              placeholder="2"
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.detailedField}
              helperText="Optional"
            />

            <FormField
              control={control}
              name="sugarPer100g"
              label="Sugar (g)"
              placeholder="5"
              keyboardType="numeric"
              returnKeyType="done"
              containerStyle={styles.detailedField}
              helperText="Optional"
            />
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
            disabled={isLoading}
          />
        )}
        
        <Button
          title={isLoading ? "Saving..." : "Save Food"}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading || !isValid}
          style={styles.submitButton}
          enableHapticFeedback={true}
        />
      </View>
    </KeyboardAwareView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...TextStyles.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  macroField: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  macroSummary: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    marginTop: Spacing.sm,
  },
  macroSummaryText: {
    ...TextStyles.body,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  macroWarning: {
    ...TextStyles.caption,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  detailedRow: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  detailedField: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});