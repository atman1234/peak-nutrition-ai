export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph'
export type Goal = 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance'
export type Units = 'imperial' | 'metric'

export interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  height: number | null
  current_weight: number | null
  target_weight: number | null
  initial_weight: number | null
  age: number | null
  gender: Gender | null
  activity_level: ActivityLevel | null
  body_type: BodyType | null
  primary_goal: Goal | null
  target_date: string | null
  preferred_units: Units | null
  daily_calorie_target: number | null
  protein_target_g: number | null
  carb_target_g: number | null
  fat_target_g: number | null
  dietary_restrictions: string[] | null
  created_at: string
  updated_at: string
}

export interface CalorieTargets {
  dailyCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  bmr: number
  tdee: number
}