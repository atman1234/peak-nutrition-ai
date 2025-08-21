import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormSelect, FormDatePicker, FormTextArea, SelectOption } from './';
import { KeyboardAwareView, Button } from '../ui';
import { foodLogSchema, FoodLogFormData } from '../../lib/validation/schemas';
import { Colors, Spacing } from '../../constants';
import { useFocusManager } from '../../hooks/useFocusManager';

interface EnhancedFoodFormProps {
  onSubmit: (data: FoodLogFormData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<FoodLogFormData>;
  isLoading?: boolean;
}

const mealTypeOptions: SelectOption[] = [
  {
    value: 'breakfast',
    label: 'Breakfast',
    description: 'Morning meal (6 AM - 11 AM)',
    icon: 'cafe-outline',
  },
  {
    value: 'lunch',
    label: 'Lunch',
    description: 'Afternoon meal (11 AM - 4 PM)',
    icon: 'restaurant-outline',
  },
  {
    value: 'dinner',
    label: 'Dinner',
    description: 'Evening meal (4 PM - 10 PM)',
    icon: 'moon-outline',
  },
  {
    value: 'snack',
    label: 'Snack',
    description: 'Light meal or snack',
    icon: 'nutrition-outline',
  },
];

export function EnhancedFoodForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  isLoading = false,
}: EnhancedFoodFormProps) {
  const focusManager = useFocusManager();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FoodLogFormData>({
    resolver: zodResolver(foodLogSchema),
    defaultValues: {
      searchTerm: '',
      portion: 100,
      mealType: 'breakfast',
      addToFavorites: false,
      notes: '',
      ...defaultValues,
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Field order for tab navigation
  const fieldOrder = ['searchTerm', 'portion', 'mealType', 'notes'];

  const handleFieldSubmit = (fieldName: string) => {
    if (fieldName === 'notes') {
      // Last field, submit form
      handleSubmit(onSubmit)();
    } else {
      // Move to next field
      focusManager.focusNext(fieldName, fieldOrder);
    }
  };

  return (
    <KeyboardAwareView
      style={styles.container}
      contentContainerStyle={styles.content}
      dismissKeyboardOnTap={true}
      enableAutomaticScroll={true}
    >
      <View style={styles.form}>
        <FormField
          control={control}
          name="searchTerm"
          label="Food Name"
          placeholder="Search for food..."
          leftIcon="search-outline"
          required={true}
          autoFocus={!defaultValues.searchTerm}
          returnKeyType="next"
          autoCapitalize="words"
          enableHapticFeedback={true}
          onSubmitEditing={() => handleFieldSubmit('searchTerm')}
          helperText="Start typing to search our food database"
        />

        <FormField
          control={control}
          name="portion"
          label="Portion Size"
          placeholder="100"
          leftIcon="scale-outline"
          keyboardType="numeric"
          required={true}
          returnKeyType="next"
          enableHapticFeedback={true}
          onSubmitEditing={() => handleFieldSubmit('portion')}
          helperText="Weight in grams"
        />

        <FormSelect
          control={control}
          name="mealType"
          label="Meal Type"
          options={mealTypeOptions}
          required={true}
          helperText="Choose the appropriate meal category"
        />

        <FormDatePicker
          control={control}
          name="loggedAt"
          label="Date & Time"
          mode="datetime"
          maximumDate={new Date()}
          helperText="When did you eat this?"
        />

        <FormTextArea
          control={control}
          name="notes"
          label="Notes"
          placeholder="Any additional notes about this food..."
          maxLength={500}
          numberOfLines={3}
          autoCapitalize="sentences"
          helperText="Optional: Add preparation method, brand, or other details"
          showCharacterCount={true}
        />
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
          title={isLoading ? "Adding..." : "Add Food"}
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
  form: {
    flex: 1,
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