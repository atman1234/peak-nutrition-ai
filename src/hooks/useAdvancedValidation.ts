import { useState, useEffect, useCallback } from 'react';
import { FieldError, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface ValidationRule<T> {
  name: string;
  validate: (value: T, allValues?: any) => boolean;
  message: string;
  severity?: 'error' | 'warning' | 'info';
  dependsOn?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  infos: Record<string, string>;
  score: number; // 0-100 validation completeness score
}

interface UseAdvancedValidationProps<T> {
  watch: UseFormWatch<T>;
  rules: ValidationRule<any>[];
  errors?: FieldErrors<T>;
}

export function useAdvancedValidation<T extends Record<string, any>>({
  watch,
  rules,
  errors = {},
}: UseAdvancedValidationProps<T>): ValidationResult {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: false,
    errors: {},
    warnings: {},
    infos: {},
    score: 0,
  });

  const watchedValues = watch();

  const validateFields = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};
    const newInfos: Record<string, string> = {};
    
    let passedRules = 0;
    let totalRules = rules.length;

    // Apply custom validation rules
    rules.forEach(rule => {
      const fieldValue = watchedValues[rule.name as keyof T];
      const isValid = rule.validate(fieldValue, watchedValues);
      
      if (!isValid) {
        switch (rule.severity || 'error') {
          case 'error':
            newErrors[rule.name] = rule.message;
            break;
          case 'warning':
            newWarnings[rule.name] = rule.message;
            break;
          case 'info':
            newInfos[rule.name] = rule.message;
            break;
        }
      } else {
        passedRules++;
      }
    });

    // Include React Hook Form errors
    Object.keys(errors).forEach(fieldName => {
      const error = errors[fieldName as keyof T];
      if (error && typeof error.message === 'string') {
        newErrors[fieldName] = error.message;
      }
    });

    const score = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;
    const isValid = Object.keys(newErrors).length === 0;

    setValidationState({
      isValid,
      errors: newErrors,
      warnings: newWarnings,
      infos: newInfos,
      score,
    });
  }, [watchedValues, rules, errors]);

  useEffect(() => {
    validateFields();
  }, [validateFields]);

  return validationState;
}

// Predefined validation rules for common scenarios
export const createNutritionValidationRules = (): ValidationRule<any>[] => [
  {
    name: 'portion',
    validate: (portion: number, values: any) => {
      if (!portion || portion <= 0) return true; // Let required validation handle this
      
      // Check for unrealistic portions
      const foodName = values.searchTerm?.toLowerCase() || '';
      
      if (foodName.includes('oil') && portion > 100) return false;
      if (foodName.includes('salt') || foodName.includes('sodium') && portion > 20) return false;
      if (foodName.includes('sugar') && portion > 200) return false;
      
      return portion <= 2000; // General upper limit
    },
    message: 'Portion size seems unusually large for this type of food',
    severity: 'warning',
    dependsOn: ['searchTerm'],
  },
  {
    name: 'macroBalance',
    validate: (_, values: any) => {
      const { proteinPer100g, carbsPer100g, fatPer100g } = values;
      
      if (!proteinPer100g && !carbsPer100g && !fatPer100g) return true;
      
      const total = (proteinPer100g || 0) + (carbsPer100g || 0) + (fatPer100g || 0);
      return total <= 100; // Cannot exceed 100g per 100g
    },
    message: 'Total macronutrients cannot exceed 100g per 100g of food',
    severity: 'error',
    dependsOn: ['proteinPer100g', 'carbsPer100g', 'fatPer100g'],
  },
  {
    name: 'calorieConsistency',
    validate: (calories: number, values: any) => {
      const { proteinPer100g, carbsPer100g, fatPer100g } = values;
      
      if (!calories || (!proteinPer100g && !carbsPer100g && !fatPer100g)) return true;
      
      const calculatedCalories = (proteinPer100g || 0) * 4 + (carbsPer100g || 0) * 4 + (fatPer100g || 0) * 9;
      const tolerance = 0.2; // 20% tolerance
      
      return Math.abs(calories - calculatedCalories) <= calculatedCalories * tolerance;
    },
    message: 'Calorie count doesn\'t match the macronutrient breakdown',
    severity: 'warning',
    dependsOn: ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'],
  },
  {
    name: 'mealTiming',
    validate: (mealType: string, values: any) => {
      if (!mealType) return true;
      
      const now = new Date();
      const hour = now.getHours();
      
      // Suggest appropriate meal times
      switch (mealType) {
        case 'breakfast':
          return hour >= 5 && hour < 12;
        case 'lunch':
          return hour >= 10 && hour < 17;
        case 'dinner':
          return hour >= 15 && hour < 23;
        case 'snack':
          return true; // Snacks are always appropriate
        default:
          return true;
      }
    },
    message: 'This meal type is unusual for the current time of day',
    severity: 'info',
  },
];

export const createPortionSuggestionRules = (): ValidationRule<any>[] => [
  {
    name: 'portionSuggestion',
    validate: (portion: number, values: any) => {
      if (!portion) return true;
      
      const foodName = values.searchTerm?.toLowerCase() || '';
      
      // Provide portion guidance
      if (foodName.includes('chicken breast') && (portion < 100 || portion > 300)) {
        return false;
      }
      if (foodName.includes('rice') && (portion < 50 || portion > 200)) {
        return false;
      }
      if (foodName.includes('banana') && (portion < 80 || portion > 150)) {
        return false;
      }
      
      return true;
    },
    message: 'Consider a typical serving size for this food',
    severity: 'info',
    dependsOn: ['searchTerm'],
  },
];

// Cross-field validation utilities
export const createCrossFieldValidation = <T extends Record<string, any>>(
  primaryField: keyof T,
  dependentFields: (keyof T)[],
  validator: (primaryValue: any, dependentValues: Partial<T>) => boolean,
  message: string,
  severity: ValidationRule<any>['severity'] = 'error'
): ValidationRule<any> => ({
  name: primaryField as string,
  validate: (value: any, allValues: T) => {
    const dependentValues = dependentFields.reduce((acc, field) => {
      acc[field] = allValues[field];
      return acc;
    }, {} as Partial<T>);
    
    return validator(value, dependentValues);
  },
  message,
  severity,
  dependsOn: dependentFields.map(f => f as string),
});