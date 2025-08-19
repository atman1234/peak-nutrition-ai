import { useFoodItems } from './useFoodItems'
import { useFavorites } from './useFavorites'
import { searchAndConvertUSDAFoods } from '../lib/usda-api'

export interface UnifiedFoodResult {
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
  source: 'user_input' | 'usda' | 'ai_estimate' | 'verified'
  usda_food_id?: string
  confidence_score?: number
  // Unified search specific fields
  relevanceScore: number
  resultType: 'favorite' | 'saved' | 'usda_foundation' | 'usda_branded'
  isFavorite: boolean
  isPreviouslyUsed: boolean
}

export function useUnifiedFoodSearch() {
  const { searchFoodItems } = useFoodItems()
  const { isFavorite, favorites } = useFavorites()

  const searchUnifiedFoods = async (query: string, limit: number = 8): Promise<UnifiedFoodResult[]> => {
    if (query.length < 2) {
      return []
    }

    try {
      // Search local foods and USDA in parallel for better performance
      const [localResults, usdaResults] = await Promise.all([
        searchFoodItems(query),
        searchAndConvertUSDAFoods(query, 15) // Get more USDA results to have good options after filtering
      ])

      // Convert local results to unified format
      const localUnified: UnifiedFoodResult[] = localResults.map(food => {
        const foodIsFavorite = isFavorite(food.id)
        
        return {
          ...food,
          relevanceScore: calculateLocalFoodRelevance(food, query, foodIsFavorite),
          resultType: foodIsFavorite ? 'favorite' as const : 'saved' as const,
          isFavorite: foodIsFavorite,
          isPreviouslyUsed: true,
        }
      })

      // Convert USDA results to unified format
      const usdaUnified: UnifiedFoodResult[] = usdaResults.map(food => {
        // Check if this USDA food matches any of our saved foods (avoid duplicates)
        const isDuplicate = localResults.some(local => 
          local.name.toLowerCase() === food.name.toLowerCase() ||
          (local.usda_food_id && local.usda_food_id === food.usda_food_id)
        )
        
        if (isDuplicate) return null

        const resultType = food.dataType === 'Foundation' || food.dataType === 'SR Legacy' 
          ? 'usda_foundation' as const 
          : 'usda_branded' as const

        return {
          id: `usda_${food.usda_food_id || Date.now()}`, // Temporary ID for USDA foods
          name: food.name,
          brand: food.brand,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          fiber_per_100g: food.fiber_per_100g,
          sugar_per_100g: food.sugar_per_100g,
          sodium_per_100g: food.sodium_per_100g,
          source: 'usda' as const,
          usda_food_id: food.usda_food_id,
          confidence_score: food.confidence_score,
          relevanceScore: food.relevanceScore || 0,
          resultType,
          isFavorite: false,
          isPreviouslyUsed: false,
        }
      }).filter(Boolean) as UnifiedFoodResult[]

      // Combine and sort all results
      const allResults = [...localUnified, ...usdaUnified]
      
      // Sort by priority: Favorites > Saved > USDA Foundation > USDA Branded
      // Within each category, sort by relevance score
      const sortedResults = allResults.sort((a, b) => {
        // Priority order
        const priorityOrder = {
          'favorite': 4,
          'saved': 3,
          'usda_foundation': 2,
          'usda_branded': 1
        }
        
        const aPriority = priorityOrder[a.resultType]
        const bPriority = priorityOrder[b.resultType]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Higher priority first
        }
        
        // Within same priority, sort by relevance score
        return b.relevanceScore - a.relevanceScore
      })

      return sortedResults.slice(0, limit)
    } catch (error) {
      console.error('Error in unified food search:', error)
      
      // Fallback to local search only if USDA fails
      try {
        const localResults = await searchFoodItems(query)
        return localResults.map(food => ({
          ...food,
          relevanceScore: calculateLocalFoodRelevance(food, query, isFavorite(food.id)),
          resultType: isFavorite(food.id) ? 'favorite' as const : 'saved' as const,
          isFavorite: isFavorite(food.id),
          isPreviouslyUsed: true,
        })).slice(0, limit)
      } catch (localError) {
        console.error('Error in fallback local search:', localError)
        return []
      }
    }
  }

  return {
    searchUnifiedFoods
  }
}

// Calculate relevance score for local foods
function calculateLocalFoodRelevance(food: any, query: string, isFavorite: boolean): number {
  const name = food.name.toLowerCase()
  const brand = (food.brand || '').toLowerCase()
  const searchTerm = query.toLowerCase()
  
  let score = 0
  
  // Base scoring
  if (name === searchTerm) {
    score += 1.0 // Exact match
  } else if (name.startsWith(searchTerm)) {
    score += 0.8 // Starts with query
  } else if (name.includes(searchTerm)) {
    score += 0.6 // Contains query
  }
  
  // Brand matching
  if (brand && brand.includes(searchTerm)) {
    score += 0.3
  }
  
  // Favorite boost
  if (isFavorite) {
    score += 2.0 // Strong boost for favorites
  } else {
    score += 1.0 // Moderate boost for previously used foods
  }
  
  // Prefer shorter names (simpler foods)
  if (name.split(' ').length <= 3) {
    score += 0.2
  }
  
  return score
}