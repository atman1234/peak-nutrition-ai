import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { getTodayLocalDate, getLocalDateRangeForQuery } from '../lib/date-utils'
import type { Tables } from '../types/supabase'
import type { DailyNutritionSummary, MealType } from '../types/food'

type FoodLog = Tables<'food_logs'>

// Utility function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export function useFoodLogs(date?: string) {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const targetDate = date || getTodayLocalDate()

  // Fetch food logs for a specific date
  const {
    data: foodLogs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['foodLogs', user?.id, targetDate],
    queryFn: async (): Promise<FoodLog[]> => {
      if (!user?.id) return []

      // Convert local date to UTC timestamp range for accurate querying
      // This ensures we get all entries made on the target local date
      const { start, end } = getLocalDateRangeForQuery(targetDate)

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', start)
        .lt('logged_at', end)
        .order('logged_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Get daily summary
  const dailySummary: DailyNutritionSummary = React.useMemo(() => {
    const summary: DailyNutritionSummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      }
    }

    foodLogs.forEach(log => {
      summary.totalCalories += log.calories_consumed || 0
      summary.totalProtein += log.protein_consumed || 0
      summary.totalCarbs += log.carbs_consumed || 0
      summary.totalFat += log.fat_consumed || 0
      
      if (log.meal_type) {
        summary.meals[log.meal_type].push(log)
      }
    })

    return summary
  }, [foodLogs])

  // Add food log mutation
  const addFoodLogMutation = useMutation({
    mutationFn: async (logData: {
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
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Validate food_item_id before inserting
      let validatedFoodItemId = logData.food_item_id || null
      if (validatedFoodItemId && !isValidUUID(validatedFoodItemId)) {
        console.warn('Invalid UUID format for food_item_id:', validatedFoodItemId)
        validatedFoodItemId = null
      }

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

      const { data, error } = await supabase
        .from('food_logs')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dailySummaries', user?.id] })
    },
  })

  // Update food log mutation
  const updateFoodLogMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: {
      id: string
      food_name?: string
      brand?: string
      portion_grams?: number
      calories_consumed?: number
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
    }) => {
      // Include all fields that exist in the food_logs table schema
      const filteredUpdateData: any = {}
      if (updateData.food_item_id !== undefined) filteredUpdateData.food_item_id = updateData.food_item_id
      if (updateData.food_name !== undefined) filteredUpdateData.food_name = updateData.food_name
      if (updateData.brand !== undefined) filteredUpdateData.brand = updateData.brand
      if (updateData.portion_grams !== undefined) filteredUpdateData.portion_grams = updateData.portion_grams
      if (updateData.calories_consumed !== undefined) filteredUpdateData.calories_consumed = updateData.calories_consumed
      if (updateData.protein_consumed !== undefined) filteredUpdateData.protein_consumed = updateData.protein_consumed
      if (updateData.carbs_consumed !== undefined) filteredUpdateData.carbs_consumed = updateData.carbs_consumed
      if (updateData.fat_consumed !== undefined) filteredUpdateData.fat_consumed = updateData.fat_consumed
      if (updateData.fiber_consumed !== undefined) filteredUpdateData.fiber_consumed = updateData.fiber_consumed
      if (updateData.sugar_consumed !== undefined) filteredUpdateData.sugar_consumed = updateData.sugar_consumed
      if (updateData.sodium_consumed !== undefined) filteredUpdateData.sodium_consumed = updateData.sodium_consumed
      if (updateData.meal_type !== undefined) filteredUpdateData.meal_type = updateData.meal_type
      if (updateData.notes !== undefined) filteredUpdateData.notes = updateData.notes
      if (updateData.ingredients !== undefined) filteredUpdateData.ingredients = updateData.ingredients

      const { data, error } = await supabase
        .from('food_logs')
        .update(filteredUpdateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs', user?.id] })
    },
  })

  // Delete food log mutation
  const deleteFoodLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodLogs', user?.id] })
    },
  })

  return {
    foodLogs,
    dailySummary,
    isLoading,
    error,
    refetch,
    addFoodLog: addFoodLogMutation.mutate,
    isAdding: addFoodLogMutation.isPending,
    addError: addFoodLogMutation.error,
    updateFoodLog: updateFoodLogMutation.mutate,
    isUpdating: updateFoodLogMutation.isPending,
    updateError: updateFoodLogMutation.error,
    deleteFoodLog: deleteFoodLogMutation.mutate,
    isDeleting: deleteFoodLogMutation.isPending,
    deleteError: deleteFoodLogMutation.error,
  }
}

export function useFoodItems(searchTerm?: string) {
  const { user } = useAuthContext()

  // Search food items
  const {
    data: foodItems = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['foodItems', searchTerm],
    queryFn: async (): Promise<FoodItem[]> => {
      let query = supabase
        .from('food_items')
        .select('*')
        .order('name')

      if (searchTerm && searchTerm.length > 2) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error
      return data || []
    },
    enabled: !searchTerm || searchTerm.length > 2,
  })

  return {
    foodItems,
    isLoading,
    error,
  }
}

export function useDailySummaries(startDate?: string, endDate?: string) {
  const { user } = useAuthContext()
  
  // Calculate default date range using local dates
  const getDefaultStartDate = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const year = sevenDaysAgo.getFullYear()
    const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')
    const day = String(sevenDaysAgo.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const start = startDate || getDefaultStartDate()
  const end = endDate || getTodayLocalDate()

  const {
    data: summaries = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['dailySummaries', user?.id, start, end],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  return {
    summaries,
    isLoading,
    error,
  }
}