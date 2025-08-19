export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodSource = 'usda' | 'ai_estimate' | 'user_input' | 'verified'

export interface FoodItem {
  id: string
  name: string
  brand: string | null
  calories_per_100g: number | null
  protein_per_100g: number | null
  carbs_per_100g: number | null
  fat_per_100g: number | null
  fiber_per_100g: number | null
  source: FoodSource | null
  usda_food_id: string | null
  confidence_score: number | null
  created_by: string | null
  created_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  food_item_id: string | null
  food_name: string
  brand: string | null
  portion_grams: number | null
  calories_consumed: number | null
  protein_consumed: number | null
  carbs_consumed: number | null
  fat_consumed: number | null
  fiber_consumed: number | null
  sodium_consumed: number | null
  sugar_consumed: number | null
  meal_type: MealType | null
  notes: string | null
  ingredients: any | null // JSONB field for ingredient breakdown
  logged_at: string
  created_at: string
  updated_at: string | null
}

export interface DailyNutritionSummary {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  meals: {
    breakfast: FoodLog[]
    lunch: FoodLog[]
    dinner: FoodLog[]
    snack: FoodLog[]
  }
}