import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/auth/AuthContext'
import { useUserTier } from './useUserTier'

interface FavoriteFood {
  id: string
  user_id: string
  food_item_id: string
  typical_portion_grams: number
  frequency_score: number
  created_at: string
  food_item: {
    id: string
    name: string
    brand?: string
    calories_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
    fiber_per_100g?: number
    sugar_per_100g?: number
    sodium_per_100g?: number
    source: string
    usda_food_id?: string
  }
}

interface NewFavorite {
  food_item_id: string
  typical_portion_grams: number
  frequency_score?: number
}

export function useFavorites() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { tierLimits, canAddFavorite, getFavoritesLimit } = useUserTier()

  // Fetch user's favorite foods
  const {
    data: favorites = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async (): Promise<FavoriteFood[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('favorite_foods')
        .select(`
          id,
          user_id,
          food_item_id,
          typical_portion_grams,
          frequency_score,
          created_at,
          food_item:food_items (
            id,
            name,
            brand,
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g,
            fiber_per_100g,
            sugar_per_100g,
            sodium_per_100g,
            source,
            usda_food_id
          )
        `)
        .eq('user_id', user.id)
        .order('frequency_score', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FavoriteFood[]
    },
    enabled: !!user?.id,
  })

  // Get top favorites (most frequently used) - limited by tier
  const maxFavorites = getFavoritesLimit()
  const topFavorites = favorites.slice(0, maxFavorites)

  // Add or update favorite food
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ food_item_id, typical_portion_grams, frequency_score = 1 }: NewFavorite) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      // Check if user can add more favorites (if it's a new favorite)
      const { data: existing } = await supabase
        .from('favorite_foods')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_item_id', food_item_id)
        .single()
        
      if (!existing && !canAddFavorite(favorites.length)) {
        throw new Error(`You've reached your favorites limit (${getFavoritesLimit()}). ${tierLimits.tier === 'free' ? 'Upgrade to Pro for more favorites!' : ''}`)
      }

      // Get existing favorite details for update
      const { data: existingDetails } = await supabase
        .from('favorite_foods')
        .select('id, frequency_score, typical_portion_grams')
        .eq('user_id', user.id)
        .eq('food_item_id', food_item_id)
        .single()

      if (existingDetails) {
        // Update existing favorite - increment frequency and update typical portion
        const { data, error } = await supabase
          .from('favorite_foods')
          .update({
            frequency_score: existingDetails.frequency_score + 1,
            typical_portion_grams: typical_portion_grams, // Update to most recent portion
          })
          .eq('id', existingDetails.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new favorite
        const { data, error } = await supabase
          .from('favorite_foods')
          .insert({
            user_id: user.id,
            food_item_id,
            typical_portion_grams,
            frequency_score,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
    },
  })

  // Remove favorite food
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
    },
  })

  // Update typical portion for a favorite
  const updatePortionMutation = useMutation({
    mutationFn: async ({ favoriteId, portion }: { favoriteId: string, portion: number }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_foods')
        .update({ typical_portion_grams: portion })
        .eq('id', favoriteId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
    },
  })

  // Check if a food item is favorited
  const isFavorite = (foodItemId: string) => {
    return favorites.some(fav => fav.food_item_id === foodItemId)
  }

  // Get typical portion for a food item
  const getTypicalPortion = (foodItemId: string) => {
    const favorite = favorites.find(fav => fav.food_item_id === foodItemId)
    return favorite?.typical_portion_grams || 100
  }

  // Get favorite by food item id
  const getFavorite = (foodItemId: string) => {
    return favorites.find(fav => fav.food_item_id === foodItemId)
  }

  return {
    favorites,
    topFavorites,
    isLoading,
    error,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    updatePortion: updatePortionMutation.mutate,
    isAdding: addFavoriteMutation.isPending,
    isRemoving: removeFavoriteMutation.isPending,
    isUpdating: updatePortionMutation.isPending,
    isFavorite,
    getTypicalPortion,
    getFavorite,
    // Tier-related exports
    tierLimits,
    canAddMoreFavorites: canAddFavorite(favorites.length),
    favoritesLimit: getFavoritesLimit(),
    favoritesCount: favorites.length,
  }
}