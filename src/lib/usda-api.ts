// USDA FoodData Central API Integration
// Requires API key - get free key from https://fdc.nal.usda.gov/api-key-signup.html

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY


export interface USDAFoodItem {
  fdcId: number
  description: string
  brandName?: string
  brandOwner?: string
  dataType: string
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    nutrientNumber: string
    unitName: string
    value: number
  }>
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
}

export interface USDASearchResult {
  foods: USDAFoodItem[]
  totalHits: number
  currentPage: number
  totalPages: number
}

// Nutrient mapping for common nutrients we track (using nutrientNumber strings)
const NUTRIENT_MAP = {
  '208': 'calories',      // Energy (kcal)
  '203': 'protein',       // Protein (g)
  '205': 'carbs',         // Carbohydrate, by difference (g)
  '204': 'fat',           // Total lipid (fat) (g)
  '291': 'fiber',         // Fiber, total dietary (g)
  '269': 'sugar',         // Sugars, total including NLEA (g)
  '307': 'sodium',        // Sodium, Na (mg)
} as const

/**
 * Search for foods in the USDA database
 */
export async function searchUSDAFoods(
  query: string,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<USDASearchResult> {
  // Try with provided API key first, fallback to DEMO_KEY for testing
  const apiKey = USDA_API_KEY || 'DEMO_KEY'
  
  if (!apiKey) {
    throw new Error('USDA API key is required. Please add EXPO_PUBLIC_USDA_API_KEY to your environment variables.')
  }

  try {
    const url = `${USDA_API_BASE}/foods/search?api_key=${apiKey}`
    
    // Use POST request with JSON body - prioritize basic foods first
    const requestBody = {
      query: query,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
      pageSize: Math.min(pageSize, 25), // Match Postman test
      sortBy: "fdcId",
      sortOrder: "desc"
    }


    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorMessage = `USDA API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.text()
        console.error('USDA API Error Response:', errorData)
        errorMessage += ` - ${errorData}`
      } catch (e) {
        console.error('Could not read error response body')
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error searching USDA foods:', error)
    throw error
  }
}

/**
 * Get detailed information about a specific food item
 */
export async function getUSDAFoodDetails(fdcId: number): Promise<USDAFoodItem | null> {
  const apiKey = USDA_API_KEY || 'DEMO_KEY'
  
  if (!apiKey) {
    throw new Error('USDA API key is required. Please add EXPO_PUBLIC_USDA_API_KEY to your environment variables.')
  }

  try {
    const url = `${USDA_API_BASE}/food/${fdcId}?api_key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting USDA food details:', error)
    throw error
  }
}

/**
 * Convert USDA food item to our FoodItem format
 */
export function convertUSDAToFoodItem(usdaFood: USDAFoodItem) {
  const nutrients: Record<string, number> = {}

  // Extract nutrients we care about
  usdaFood.foodNutrients.forEach(nutrient => {
    const mappedName = NUTRIENT_MAP[nutrient.nutrientNumber as keyof typeof NUTRIENT_MAP]
    if (mappedName) {
      nutrients[mappedName] = nutrient.value
    }
  })

  return {
    name: usdaFood.description,
    brand: usdaFood.brandName || usdaFood.brandOwner || null,
    calories_per_100g: nutrients.calories || 0,
    protein_per_100g: nutrients.protein || 0,
    carbs_per_100g: nutrients.carbs || 0,
    fat_per_100g: nutrients.fat || 0,
    fiber_per_100g: nutrients.fiber || 0,
    sugar_per_100g: nutrients.sugar || 0,
    sodium_per_100g: nutrients.sodium || 0,
    source: 'usda' as const,
    usda_food_id: usdaFood.fdcId.toString(),
    confidence_score: 1.0, // USDA data is highly reliable
  }
}

/**
 * Calculate string similarity score (0-1) using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  // Exact match gets highest score
  if (s1 === s2) return 1.0
  
  // Check if one starts with the other
  if (s1.startsWith(s2) || s2.startsWith(s1)) return 0.9
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Calculate Levenshtein distance
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      )
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length)
  return maxLength > 0 ? 1 - (matrix[s2.length][s1.length] / maxLength) : 0
}

/**
 * Score food item relevance to search query
 */
function scoreFoodRelevance(usdaFood: USDAFoodItem, query: string): number {
  const name = usdaFood.description.toLowerCase()
  const brand = (usdaFood.brandName || usdaFood.brandOwner || '').toLowerCase()
  const searchTerm = query.toLowerCase()
  
  // Calculate base similarity score with name
  let score = calculateSimilarity(name, searchTerm)
  
  // If search term appears in brand, give significant boost
  if (brand && searchTerm.includes(' ')) {
    // Split search for brand matching (e.g., "baked tofu house")
    const searchWords = searchTerm.split(' ')
    searchWords.forEach(word => {
      if (word.length > 2 && brand.includes(word)) {
        score += 0.5 // Strong boost for brand matches
      }
    })
  } else if (brand && brand.includes(searchTerm)) {
    score += 0.4 // Brand contains search term
  }
  
  // Major boost for exact matches
  if (name === searchTerm) {
    score += 0.5
  }
  
  // Strong boost for single-word exact matches at word boundaries
  const words = name.split(/[\s,]+/)
  const searchWords = searchTerm.split(/[\s,]+/)
  
  // Check for exact word matches
  if (searchWords.length === 1 && words.includes(searchWords[0])) {
    score += 0.4
  }
  
  // Boost for names that start with the search term
  if (name.startsWith(searchTerm)) {
    score += 0.3
  }
  
  // Data type priority boost (Foundation > SR Legacy > Survey > Branded)
  if (usdaFood.dataType === 'Foundation') {
    score += 0.25
  } else if (usdaFood.dataType === 'SR Legacy') {
    score += 0.2
  } else if (usdaFood.dataType === 'Survey (FNDDS)') {
    score += 0.1
  }
  // Branded foods get no boost (neutral)
  
  // Strong penalty for excessive word count (complex foods)
  const wordCount = words.length
  if (wordCount <= 2) {
    score += 0.3 // Strong boost for simple foods
  } else if (wordCount <= 4) {
    score += 0.15
  } else if (wordCount <= 6) {
    score += 0.05
  } else if (wordCount >= 8) {
    score -= 0.2 // Heavy penalty for complex foods
  }
  
  // Heavy penalty for restaurant/brand names (appears in all caps)
  const restaurantBrands = [
    'denny\'s', 'cracker barrel', 'taco bell', 'applebee\'s', 'mcdonald\'s', 
    't.g.i. friday\'s', 'burger king', 'wendy\'s', 'kfc', 'pizza hut',
    'domino\'s', 'papa john\'s', 'subway', 'chipotle', 'panera', 'starbucks',
    'restaurant', 'chain'
  ]
  const hasRestaurantBrand = restaurantBrands.some(brand => name.includes(brand))
  if (hasRestaurantBrand) {
    score -= 0.4 // Heavy penalty for restaurant foods
  }

  // Heavy penalty for complex prepared foods and ingredient lists
  const complexTerms = [
    'prepared', 'recipe', 'homemade', 'mixed', 'dish', 'meal', 'frozen meal',
    'with sauce', 'in sauce', 'seasoned', 'marinated', 'stuffed', 'breaded',
    'battered', 'fried', 'cooked with', 'fast food', 'salisbury', 'sauce',
    'gravy', 'burrito', 'taco', 'soft taco', 'fries'
  ]
  const hasComplexTerms = complexTerms.some(term => name.includes(term))
  if (hasComplexTerms) {
    score -= 0.3
  }
  
  // Penalty for ingredient lists (contains commas)
  if (name.includes(',') && name.split(',').length > 2) {
    score -= 0.15
  }
  
  // Penalty for parenthetical descriptions (often indicates preparation method)
  if (name.includes('(') && name.includes(')')) {
    score -= 0.05
  }
  
  // Strong boost for basic meat cuts and simple ingredients
  const basicMeatTerms = [
    'beef, chuck', 'beef, round', 'beef, loin', 'beef, rib', 'beef, brisket',
    'beef, flank', 'beef, sirloin', 'pork, loin', 'pork, shoulder', 'chicken breast',
    'chicken thigh', 'chicken, broilers', 'turkey, all classes', 'fish, salmon',
    'fish, tuna', 'lamb, domestic'
  ]
  const hasBasicMeat = basicMeatTerms.some(term => name.includes(term))
  if (hasBasicMeat) {
    score += 0.35 // Strong boost for basic cuts
  }

  // Medium boost for raw/basic preparation terms
  const basicTerms = ['raw', 'fresh', 'plain', 'unseasoned', 'lean', 'ground', 'boneless']
  const hasBasicTerms = basicTerms.some(term => name.includes(term))
  if (hasBasicTerms) {
    score += 0.15
  }
  
  return Math.max(0, score) // Don't cap at 1.0 to allow differentiation
}

/**
 * Search all pages of USDA foods (comprehensive search)
 */
export async function searchAllUSDAFoods(
  query: string,
  maxResults: number = 200
): Promise<USDASearchResult> {
  const apiKey = USDA_API_KEY || 'DEMO_KEY'
  
  if (!apiKey) {
    throw new Error('USDA API key is required. Please add EXPO_PUBLIC_USDA_API_KEY to your environment variables.')
  }

  const url = `${USDA_API_BASE}/foods/search?api_key=${apiKey}`
  const allFoods: USDAFoodItem[] = []
  let currentPage = 1
  let totalHits = 0
  const pageSize = 25 // Maximum allowed by API
  
  try {
    // Get first page to determine total results - prioritize basic foods
    const requestBody = {
      query: query,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"], // Prioritize basic foods
      pageSize: pageSize,
      pageNumber: currentPage
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
    }

    const firstPageData = await response.json()
    totalHits = firstPageData.totalHits
    allFoods.push(...firstPageData.foods)
    
    // Calculate how many more pages we need
    const maxPages = Math.min(
      Math.ceil(maxResults / pageSize),
      Math.ceil(totalHits / pageSize),
      20 // Reasonable limit to prevent excessive API calls
    )
    
    // Fetch remaining pages concurrently (in batches to avoid overwhelming the API)
    const batchSize = 5
    for (let batchStart = 2; batchStart <= maxPages; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, maxPages)
      const batchPromises = []
      
      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        const batchRequestBody = {
          ...requestBody,
          pageNumber: pageNum
        }
        
        batchPromises.push(
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batchRequestBody)
          }).then(res => res.ok ? res.json() : null)
        )
      }
      
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(result => {
        if (result && result.foods) {
          allFoods.push(...result.foods)
        }
      })
      
      // Stop if we have enough results
      if (allFoods.length >= maxResults) break
    }
    
    return {
      foods: allFoods.slice(0, maxResults),
      totalHits: totalHits,
      currentPage: 1,
      totalPages: Math.ceil(totalHits / pageSize)
    }
    
  } catch (error) {
    console.error('Error in comprehensive USDA search:', error)
    throw error
  }
}

/**
 * Search and convert USDA foods to our format
 */
export async function searchAndConvertUSDAFoods(query: string, limit: number = 50) {
  try {
    // Use comprehensive search to get more results
    const searchResults = await searchAllUSDAFoods(query, Math.min(limit * 4, 200))
    
    // Convert and score all foods
    const convertedFoods = searchResults.foods.map(usdaFood => {
      const converted = convertUSDAToFoodItem(usdaFood)
      return {
        ...converted,
        relevanceScore: scoreFoodRelevance(usdaFood, query),
        dataType: usdaFood.dataType
      }
    })
    
    // Filter out foods with no calorie information
    const filteredFoods = convertedFoods.filter(food => 
      food.calories_per_100g > 0
    )
    
    // Sort by relevance score (highest first)
    const sortedFoods = filteredFoods.sort((a, b) => {
      // Primary sort: relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      
      // Secondary sort: prefer Foundation/SR Legacy over Branded
      const aIsBasic = a.dataType === 'Foundation' || a.dataType === 'SR Legacy'
      const bIsBasic = b.dataType === 'Foundation' || b.dataType === 'SR Legacy'
      if (aIsBasic !== bIsBasic) {
        return bIsBasic ? 1 : -1
      }
      
      // Tertiary sort: prefer shorter names (simpler foods)
      return a.name.length - b.name.length
    })
    
    // Debug logging - show top 10 results with scores
    console.log(`\n=== USDA Search Results for "${query}" ===`)
    sortedFoods.slice(0, 10).forEach((food, index) => {
      console.log(`${index + 1}. [${food.relevanceScore.toFixed(3)}] [${food.dataType}] ${food.name}`)
    })
    console.log(`Total results: ${sortedFoods.length}`)
    console.log('=======================================\n')
    
    return sortedFoods.slice(0, limit)
  } catch (error) {
    console.error('Error searching and converting USDA foods:', error)
    return []
  }
}

/**
 * Estimate portion from common serving descriptions
 */
export function estimatePortionFromDescription(description: string): number {
  const text = description.toLowerCase()
  
  // Common portion estimates in grams
  const portions: Record<string, number> = {
    'small': 80,
    'medium': 120,
    'large': 180,
    'cup': 240,
    'tablespoon': 15,
    'teaspoon': 5,
    'slice': 30,
    'piece': 100,
    'serving': 100,
    'portion': 100,
    'banana': 120,
    'apple': 180,
    'orange': 150,
    'egg': 50,
    'chicken breast': 150,
    'chicken thigh': 120,
  }

  // Try to find portion keywords
  for (const [keyword, grams] of Object.entries(portions)) {
    if (text.includes(keyword)) {
      return grams
    }
  }

  // Extract numbers from description
  const numberMatch = text.match(/(\d+)\s*(g|gram|grams|oz|ounce|ounces)/i)
  if (numberMatch) {
    const value = parseInt(numberMatch[1])
    const unit = numberMatch[2].toLowerCase()
    
    if (unit.startsWith('g')) {
      return value
    } else if (unit.startsWith('oz')) {
      return Math.round(value * 28.35) // Convert oz to grams
    }
  }

  // Default portion size
  return 100
}

/**
 * Calculate nutrition for a specific portion size
 */
export function calculatePortionNutrition(
  foodItem: ReturnType<typeof convertUSDAToFoodItem>,
  portionGrams: number
) {
  const multiplier = portionGrams / 100

  return {
    calories: Math.round(foodItem.calories_per_100g * multiplier),
    protein: Math.round(foodItem.protein_per_100g * multiplier * 10) / 10,
    carbs: Math.round(foodItem.carbs_per_100g * multiplier * 10) / 10,
    fat: Math.round(foodItem.fat_per_100g * multiplier * 10) / 10,
    fiber: Math.round(foodItem.fiber_per_100g * multiplier * 10) / 10,
    sugar: Math.round(foodItem.sugar_per_100g * multiplier * 10) / 10,
    sodium: Math.round(foodItem.sodium_per_100g * multiplier * 10) / 10,
  }
}