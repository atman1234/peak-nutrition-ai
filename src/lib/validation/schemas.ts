import { z } from 'zod';

// =============================================================================
// ENHANCED VALIDATION SCHEMAS FOR CALORIE TRACKER APP
// =============================================================================

// Common validation helpers
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform(val => val.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one uppercase letter, one lowercase letter, and one number');

const positiveNumberSchema = (message: string) => z
  .number({ message: `${message} must be a number` })
  .positive(`${message} must be greater than 0`);

const optionalPositiveNumberSchema = (message: string) => z
  .number({ message: `${message} must be a number` })
  .positive(`${message} must be greater than 0`)
  .optional();

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// =============================================================================
// PROFILE SCHEMAS
// =============================================================================

export const profileSetupSchema = z.object({
  age: z
    .number({ message: 'Age must be a number' })
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Age must be less than 120 years'),
  weight: positiveNumberSchema('Weight')
    .min(30, 'Weight must be at least 30 lbs/kg')
    .max(1000, 'Weight must be less than 1000 lbs/kg'),
  height: positiveNumberSchema('Height')
    .min(48, 'Height must be at least 48 inches/cm')
    .max(300, 'Height must be less than 300 inches/cm'),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
  goal: z.enum(['lose_weight', 'maintain', 'gain_weight', 'gain_muscle']),
  dailyCalorieTarget: z
    .number({ message: 'Daily calorie target must be a number' })
    .min(800, 'Daily calorie target must be at least 800 calories')
    .max(10000, 'Daily calorie target must be less than 10,000 calories'),
  preferredUnits: z.enum(['metric', 'imperial']).default('imperial'),
}).refine((data) => {
  // Contextual validation based on goal
  if (data.goal === 'lose_weight' && data.dailyCalorieTarget > 3500) {
    return false;
  }
  if (data.goal === 'gain_muscle' && data.dailyCalorieTarget < 2000) {
    return false;
  }
  return true;
}, {
  message: 'Daily calorie target should align with your selected goal',
  path: ['dailyCalorieTarget']
});

export const profileUpdateSchema = profileSetupSchema.partial().extend({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
});

// =============================================================================
// FOOD & NUTRITION SCHEMAS
// =============================================================================

export const foodLogSchema = z.object({
  searchTerm: z
    .string()
    .min(1, 'Please search for a food')
    .max(200, 'Search term must be less than 200 characters')
    .transform(val => val.trim()),
  portion: z
    .number({ message: 'Portion must be a number' })
    .min(0.1, 'Portion must be at least 0.1 grams')
    .max(10000, 'Portion must be less than 10,000 grams'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  addToFavorites: z.boolean().optional().default(false),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine((data) => {
  // Smart portion validation based on meal type
  const maxPortions = {
    breakfast: 1000,
    lunch: 1500,
    dinner: 1500,
    snack: 500
  };
  return data.portion <= maxPortions[data.mealType];
}, {
  message: 'Portion size seems unusually large for this meal type',
  path: ['portion']
});

export const customFoodSchema = z.object({
  name: z
    .string()
    .min(1, 'Food name is required')
    .max(100, 'Food name must be less than 100 characters')
    .transform(val => val.trim()),
  brand: z.string().max(100, 'Brand must be less than 100 characters').optional(),
  caloriesPer100g: positiveNumberSchema('Calories per 100g')
    .max(900, 'Calories per 100g cannot exceed 900 (pure fat limit)'),
  proteinPer100g: z
    .number({ message: 'Protein must be a number' })
    .min(0, 'Protein cannot be negative')
    .max(100, 'Protein per 100g cannot exceed 100g'),
  carbsPer100g: z
    .number({ message: 'Carbs must be a number' })
    .min(0, 'Carbs cannot be negative')
    .max(100, 'Carbs per 100g cannot exceed 100g'),
  fatPer100g: z
    .number({ message: 'Fat must be a number' })
    .min(0, 'Fat cannot be negative')
    .max(100, 'Fat per 100g cannot exceed 100g'),
  fiberPer100g: z
    .number({ message: 'Fiber must be a number' })
    .min(0, 'Fiber cannot be negative')
    .max(50, 'Fiber per 100g cannot exceed 50g')
    .optional(),
  sugarPer100g: z
    .number({ message: 'Sugar must be a number' })
    .min(0, 'Sugar cannot be negative')
    .max(100, 'Sugar per 100g cannot exceed 100g')
    .optional(),
}).refine((data) => {
  // Validate macronutrient totals don't exceed reasonable limits
  const macroTotal = data.proteinPer100g + data.carbsPer100g + data.fatPer100g;
  return macroTotal <= 100;
}, {
  message: 'Total macronutrients cannot exceed 100g per 100g',
  path: ['fatPer100g']
}).refine((data) => {
  // Calorie calculation validation (rough estimate)
  const calculatedCalories = (data.proteinPer100g * 4) + (data.carbsPer100g * 4) + (data.fatPer100g * 9);
  const tolerance = 0.15; // 15% tolerance
  return Math.abs(data.caloriesPer100g - calculatedCalories) <= calculatedCalories * tolerance;
}, {
  message: 'Calorie count doesn\'t match macronutrient breakdown',
  path: ['caloriesPer100g']
});

// =============================================================================
// WEIGHT TRACKING SCHEMAS
// =============================================================================

export const weightEntrySchema = z.object({
  weight: positiveNumberSchema('Weight')
    .min(30, 'Weight must be at least 30 lbs/kg')
    .max(1000, 'Weight must be less than 1000 lbs/kg'),
  bodyFatPercentage: z
    .number({ message: 'Body fat percentage must be a number' })
    .min(2, 'Body fat percentage must be at least 2%')
    .max(60, 'Body fat percentage must be less than 60%')
    .optional(),
  muscleMass: positiveNumberSchema('Muscle mass')
    .max(200, 'Muscle mass must be less than 200 lbs/kg')
    .optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  recordedAt: z.string().optional(), // Will be set to current date if not provided
}).refine((data) => {
  // Validate muscle mass doesn't exceed total weight
  if (data.muscleMass && data.muscleMass >= data.weight) {
    return false;
  }
  return true;
}, {
  message: 'Muscle mass cannot exceed total body weight',
  path: ['muscleMass']
});

// =============================================================================
// GOAL & TARGET SCHEMAS
// =============================================================================

export const nutritionGoalsSchema = z.object({
  dailyCalorieTarget: z
    .number({ message: 'Daily calorie target must be a number' })
    .min(800, 'Daily calorie target must be at least 800 calories')
    .max(10000, 'Daily calorie target must be less than 10,000 calories'),
  proteinTargetG: positiveNumberSchema('Protein target')
    .max(500, 'Protein target must be less than 500g'),
  carbTargetG: positiveNumberSchema('Carb target')
    .max(1000, 'Carb target must be less than 1000g'),
  fatTargetG: positiveNumberSchema('Fat target')
    .max(300, 'Fat target must be less than 300g'),
  fiberTargetG: positiveNumberSchema('Fiber target')
    .max(100, 'Fiber target must be less than 100g')
    .optional(),
}).refine((data) => {
  // Validate macronutrient targets align with calorie target
  const macroCalories = (data.proteinTargetG * 4) + (data.carbTargetG * 4) + (data.fatTargetG * 9);
  const tolerance = 0.2; // 20% tolerance
  return Math.abs(data.dailyCalorieTarget - macroCalories) <= data.dailyCalorieTarget * tolerance;
}, {
  message: 'Macronutrient targets don\'t align with daily calorie target',
  path: ['dailyCalorieTarget']
});

// =============================================================================
// SETTINGS & PREFERENCES SCHEMAS
// =============================================================================

export const userPreferencesSchema = z.object({
  preferredUnits: z.enum(['metric', 'imperial']),
  defaultMealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  enableNotifications: z.boolean().default(true),
  notificationTimes: z.object({
    breakfast: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
    lunch: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
    dinner: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  }).optional(),
  dataExportFormat: z.enum(['csv', 'json']).default('csv'),
  privacySettings: z.object({
    shareData: z.boolean().default(false),
    shareProgress: z.boolean().default(false),
  }),
});

// =============================================================================
// VALIDATION HELPERS & UTILITIES
// =============================================================================

export const validatePortionSize = (portion: number, foodType: string = ''): string | null => {
  if (portion <= 0) return 'Portion must be greater than 0';
  if (portion > 5000) return 'Portion size seems unusually large';
  
  // Context-aware portion validation
  if (foodType.toLowerCase().includes('oil') && portion > 50) {
    return 'Oil portion seems unusually large';
  }
  if (foodType.toLowerCase().includes('salt') && portion > 10) {
    return 'Salt portion seems unusually large';
  }
  
  return null;
};

export const validateMacroBalance = (protein: number, carbs: number, fat: number): string | null => {
  const total = protein + carbs + fat;
  if (total === 0) return 'At least one macronutrient must be specified';
  
  const proteinPercent = (protein / total) * 100;
  const carbPercent = (carbs / total) * 100;
  const fatPercent = (fat / total) * 100;
  
  if (proteinPercent > 60) return 'Protein percentage seems unusually high';
  if (carbPercent > 80) return 'Carbohydrate percentage seems unusually high';
  if (fatPercent > 70) return 'Fat percentage seems unusually high';
  
  return null;
};

// Real-time validation context provider
export const getValidationContext = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Suggest default meal type based on time
  let suggestedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
  if (hour >= 6 && hour < 11) suggestedMealType = 'breakfast';
  else if (hour >= 11 && hour < 16) suggestedMealType = 'lunch';
  else if (hour >= 16 && hour < 22) suggestedMealType = 'dinner';
  
  return {
    currentTime: now,
    suggestedMealType,
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
  };
};

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type FoodLogFormData = z.infer<typeof foodLogSchema>;
export type CustomFoodFormData = z.infer<typeof customFoodSchema>;
export type WeightEntryFormData = z.infer<typeof weightEntrySchema>;
export type NutritionGoalsFormData = z.infer<typeof nutritionGoalsSchema>;
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;