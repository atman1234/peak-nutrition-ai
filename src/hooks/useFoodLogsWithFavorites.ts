import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useFoodLogs } from './useFoodLogs'
import { useFavorites } from './useFavorites'
import type { MealType } from '../types/food'

// Utility function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

interface FoodLogWithFavoritesData {
  food_name: string
  brand?: string
  portion_grams: number
  calories_consumed: number
  protein_consumed?: number
  carbs_consumed?: number
  fat_consumed?: number
  fiber_consumed?: number
  sugar_consumed?: number
  sodium_consumed?: number
  meal_type?: MealType
  food_item_id?: string
  notes?: string
  ingredients?: any
  logged_at?: string
}

export function useFoodLogsWithFavorites() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { addFavorite } = useFavorites()
  
  // Get all the regular food log functionality
  const foodLogsHook = useFoodLogs()

  // Enhanced add food log that also handles favorites
  const addFoodLogWithFavorites = useMutation({
    mutationFn: async (logData: FoodLogWithFavoritesData) => {
      if (!user?.id) throw new Error('User not authenticated')

      let finalFoodItemId = logData.food_item_id

      // If no food_item_id provided, create a food item first
      if (!finalFoodItemId) {
        try {
          // Calculate nutrition per 100g from the consumed amounts
          const caloriesPer100g = (logData.calories_consumed / logData.portion_grams) * 100
          const proteinPer100g = ((logData.protein_consumed || 0) / logData.portion_grams) * 100
          const carbsPer100g = ((logData.carbs_consumed || 0) / logData.portion_grams) * 100
          const fatPer100g = ((logData.fat_consumed || 0) / logData.portion_grams) * 100
          const fiberPer100g = ((logData.fiber_consumed || 0) / logData.portion_grams) * 100
          const sugarPer100g = ((logData.sugar_consumed || 0) / logData.portion_grams) * 100
          const sodiumPer100g = ((logData.sodium_consumed || 0) / logData.portion_grams) * 100

          const { data: newFoodItem, error: foodItemError } = await supabase
            .from('food_items')
            .insert({
              name: logData.food_name,
              brand: logData.brand || null,
              calories_per_100g: caloriesPer100g,
              protein_per_100g: proteinPer100g,
              carbs_per_100g: carbsPer100g,
              fat_per_100g: fatPer100g,
              fiber_per_100g: fiberPer100g,
              sugar_per_100g: sugarPer100g,
              sodium_per_100g: sodiumPer100g,
              source: 'user_input',
              confidence_score: 0.8,
              created_by: user.id,
            })
            .select()
            .single()

          if (foodItemError) {
            // If insertion fails (likely duplicate), try to find existing food item
            const { data: existingFood } = await supabase
              .from('food_items')
              .select('id')
              .eq('name', logData.food_name)
              .eq('brand', logData.brand || null)
              .single()
            
            finalFoodItemId = existingFood?.id || null
          } else {
            finalFoodItemId = newFoodItem.id
          }
        } catch (err) {
          console.warn('Failed to create food item, proceeding without food_item_id:', err)
        }
      }

      // Validate food_item_id before inserting
      let validatedFoodItemId = finalFoodItemId
      if (finalFoodItemId && !isValidUUID(finalFoodItemId)) {
        console.warn('Invalid UUID format for food_item_id:', finalFoodItemId)
        validatedFoodItemId = null
      }

      // Add the food log with food_item_id if available
      // Include all fields that exist in the food_logs table schema
      const insertData = {
        user_id: user.id,
        logged_at: logData.logged_at ? new Date(logData.logged_at).toISOString() : new Date().toISOString(),
        food_item_id: validatedFoodItemId,
        food_name: logData.food_name,
        brand: logData.brand || null,
        portion_grams: logData.portion_grams,
        calories_consumed: logData.calories_consumed,
        protein_consumed: logData.protein_consumed || null,
        carbs_consumed: logData.carbs_consumed || null,
        fat_consumed: logData.fat_consumed || null,
        fiber_consumed: logData.fiber_consumed || null,
        sugar_consumed: logData.sugar_consumed || null,
        sodium_consumed: logData.sodium_consumed || null,
        meal_type: logData.meal_type || null,
        notes: logData.notes || null,
        ingredients: logData.ingredients || null,
      }

      console.log('Inserting food log with validated data:', insertData)

      const { data: logResult, error: logError } = await supabase
        .from('food_logs')
        .insert(insertData)
        .select()
        .single()

      if (logError) {
        console.error('Food log insertion error:', logError)
        console.error('Attempted to insert:', {
          user_id: user.id,
          logged_at: new Date().toISOString(),
          food_item_id: finalFoodItemId,
          food_name: logData.food_name,
          portion_grams: logData.portion_grams,
          calories_consumed: logData.calories_consumed,
          protein_consumed: logData.protein_consumed || null,
          carbs_consumed: logData.carbs_consumed || null,
          fat_consumed: logData.fat_consumed || null,
          meal_type: logData.meal_type || null,
        })
        throw logError
      }

      // Note: Removed auto-favoriting behavior - users must manually favorite foods
      // This prevents every food from automatically becoming a favorite

      return logResult
    },
    onSuccess: () => {
      // Invalidate food logs only (no longer auto-updating favorites)
      queryClient.invalidateQueries({ queryKey: ['foodLogs', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dailySummaries', user?.id] })
    },
  })

  return {
    ...foodLogsHook,
    addFoodLogWithFavorites: addFoodLogWithFavorites.mutate,
    isAddingWithFavorites: addFoodLogWithFavorites.isPending,
    addWithFavoritesError: addFoodLogWithFavorites.error,
  }
}