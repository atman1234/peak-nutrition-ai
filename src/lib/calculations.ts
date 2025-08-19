import type { Gender, ActivityLevel, Goal, CalorieTargets } from '../types/profile'

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little to no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Heavy exercise 6-7 days/week
  very_active: 1.9     // Very heavy exercise, physical job, or 2x/day training
} as const

// Goal-based calorie adjustments (calories per day)
const GOAL_ADJUSTMENTS = {
  weight_loss: -500,     // 1 lb/week loss
  weight_gain: +500,     // 1 lb/week gain
  muscle_gain: +300,     // Lean bulk
  maintenance: 0         // Maintain current weight
} as const

// Macro distribution percentages by goal
const MACRO_DISTRIBUTIONS = {
  weight_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  weight_gain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  muscle_gain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  maintenance: { protein: 0.25, carbs: 0.45, fat: 0.30 }
} as const

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * More accurate than Harris-Benedict for modern populations
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  
  switch (gender) {
    case 'male':
      return base + 5
    case 'female':
      return base - 161
    case 'other':
      // Use average of male/female calculations
      return base - 78
    default:
      throw new Error('Invalid gender provided')
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * BMR multiplied by activity level factor
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]
  if (!multiplier) {
    throw new Error('Invalid activity level provided')
  }
  return Math.round(bmr * multiplier)
}

/**
 * Calculate daily calorie target based on goal
 */
export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  const adjustment = GOAL_ADJUSTMENTS[goal]
  if (adjustment === undefined) {
    throw new Error('Invalid goal provided')
  }
  return Math.max(1200, tdee + adjustment) // Minimum 1200 calories for safety
}

/**
 * Calculate macro targets in grams
 */
export function calculateMacroTargets(
  dailyCalories: number,
  goal: Goal
): { proteinGrams: number; carbGrams: number; fatGrams: number } {
  const distribution = MACRO_DISTRIBUTIONS[goal]
  if (!distribution) {
    throw new Error('Invalid goal provided')
  }

  // Calories per gram: Protein = 4, Carbs = 4, Fat = 9
  const proteinGrams = Math.round((dailyCalories * distribution.protein) / 4)
  const carbGrams = Math.round((dailyCalories * distribution.carbs) / 4)
  const fatGrams = Math.round((dailyCalories * distribution.fat) / 9)

  return { proteinGrams, carbGrams, fatGrams }
}

/**
 * Calculate all calorie and macro targets
 */
export function calculateAllTargets(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal
): CalorieTargets {
  const bmr = calculateBMR(weight_kg, height_cm, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)
  const dailyCalories = calculateCalorieTarget(tdee, goal)
  const { proteinGrams, carbGrams, fatGrams } = calculateMacroTargets(dailyCalories, goal)

  return {
    dailyCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    bmr: Math.round(bmr),
    tdee
  }
}

/**
 * Calculate ideal weight range based on BMI
 */
export function calculateIdealWeightRange(height_cm: number): { min: number; max: number } {
  const height_m = height_cm / 100
  const minBMI = 18.5
  const maxBMI = 24.9
  
  return {
    min: Math.round(minBMI * height_m * height_m * 10) / 10,
    max: Math.round(maxBMI * height_m * height_m * 10) / 10
  }
}

/**
 * Calculate current BMI
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

/**
 * Calculate estimated time to reach target weight
 */
export function calculateTimeToGoal(
  currentWeight: number,
  targetWeight: number,
  goal: Goal
): { weeks: number; date: Date } {
  const weightDifference = Math.abs(targetWeight - currentWeight)
  
  // Safe weight loss/gain rates (kg per week)
  const ratePerWeek = goal === 'weight_loss' ? 0.45 : 0.23 // 1 lb or 0.5 lb
  
  const weeks = Math.ceil(weightDifference / ratePerWeek)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + (weeks * 7))
  
  return { weeks, date: targetDate }
}

/**
 * Validate user profile inputs
 */
export function validateProfileInputs(data: {
  height_cm: number
  current_weight_kg: number
  target_weight_kg: number
  age: number
  gender: Gender
  activity_level: ActivityLevel
  primary_goal: Goal
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Height validation
  if (data.height_cm < 100 || data.height_cm > 250) {
    errors.push('Height must be between 100-250 cm')
  }

  // Weight validation
  if (data.current_weight_kg < 30 || data.current_weight_kg > 300) {
    errors.push('Current weight must be between 30-300 kg')
  }
  
  if (data.target_weight_kg < 30 || data.target_weight_kg > 300) {
    errors.push('Target weight must be between 30-300 kg')
  }

  // Age validation
  if (data.age < 13 || data.age > 120) {
    errors.push('Age must be between 13-120 years')
  }

  // Enum validations
  if (!['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Invalid gender selection')
  }

  if (!Object.keys(ACTIVITY_MULTIPLIERS).includes(data.activity_level)) {
    errors.push('Invalid activity level selection')
  }

  if (!Object.keys(GOAL_ADJUSTMENTS).includes(data.primary_goal)) {
    errors.push('Invalid goal selection')
  }

  return { isValid: errors.length === 0, errors }
}