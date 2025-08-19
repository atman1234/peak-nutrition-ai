import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface FoodItem {
  id: string
  name: string
  brand?: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  sodium_per_100g?: number
  source: 'user_input' | 'usda' | 'ai_estimate' | 'verified'
  usda_food_id?: string | null
  confidence_score?: number
  created_at?: string
  updated_at?: string
}

export function useFoodItems() {
  const queryClient = useQueryClient()

  // Get food items for current user
  const { data: foodItems = [], isLoading } = useQuery({
    queryKey: ['food-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FoodItem[]
    },
  })

  // Search food items
  const searchFoodItems = async (query: string) => {
    // Escape special characters for Supabase query
    const escapedQuery = query.replace(/[,()%]/g, '\\$&')
    
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .or(`name.ilike.%${escapedQuery}%,brand.ilike.%${escapedQuery}%`)
      .limit(20)

    if (error) throw error
    return data as FoodItem[]
  }

  // Add new food item
  const addFoodItemMutation = useMutation({
    mutationFn: async (foodItem: Omit<FoodItem, 'id' | 'created_at' | 'updated_at'>) => {
      // Check if food item already exists (by name and source)
      const { data: existing } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', foodItem.name)
        .eq('source', foodItem.source)
        .maybeSingle()

      if (existing) {
        return existing as FoodItem
      }

      // Create new food item
      const { data, error } = await supabase
        .from('food_items')
        .insert(foodItem)
        .select()
        .single()

      if (error) throw error
      return data as FoodItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] })
    },
  })

  // Update food item
  const updateFoodItemMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FoodItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('food_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as FoodItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] })
    },
  })

  // Delete food item
  const deleteFoodItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] })
    },
  })

  return {
    foodItems,
    isLoading,
    searchFoodItems,
    addFoodItem: addFoodItemMutation.mutateAsync,
    updateFoodItem: updateFoodItemMutation.mutateAsync,
    deleteFoodItem: deleteFoodItemMutation.mutateAsync,
    isAdding: addFoodItemMutation.isPending,
    isUpdating: updateFoodItemMutation.isPending,
    isDeleting: deleteFoodItemMutation.isPending,
  }
}