import { Database } from '../types/supabase'

type WeightEntry = Database['public']['Tables']['weight_entries']['Row']
type FoodLog = Database['public']['Tables']['food_logs']['Row']

/**
 * Calculate BMI (Body Mass Index)
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  value: number
  category: string
  color: string
} {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  
  let category: string
  let color: string
  
  if (bmi < 18.5) {
    category = 'Underweight'
    color = 'text-blue-600'
  } else if (bmi < 25) {
    category = 'Normal weight'
    color = 'text-green-600'
  } else if (bmi < 30) {
    category = 'Overweight'
    color = 'text-amber-600'
  } else {
    category = 'Obese'
    color = 'text-red-600'
  }
  
  return {
    value: Math.round(bmi * 10) / 10,
    category,
    color,
  }
}

/**
 * Calculate weight loss/gain rate and project future weight
 */
export function calculateWeightProjection(
  weightEntries: WeightEntry[],
  targetWeight: number,
  daysToProject: number = 90
): {
  projectedWeight: number
  daysToTarget: number | null
  weeklyRate: number
  isHealthyRate: boolean
} {
  if (weightEntries.length < 2) {
    return {
      projectedWeight: weightEntries[0]?.weight || 0,
      daysToTarget: null,
      weeklyRate: 0,
      isHealthyRate: true,
    }
  }
  
  // Calculate average weekly rate using linear regression
  const sortedEntries = [...weightEntries].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  )
  
  const firstEntry = sortedEntries[0]
  const lastEntry = sortedEntries[sortedEntries.length - 1]
  
  const daysDiff = Math.max(
    1,
    (new Date(lastEntry.recorded_at).getTime() - new Date(firstEntry.recorded_at).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  
  const weightDiff = lastEntry.weight - firstEntry.weight
  const dailyRate = weightDiff / daysDiff
  const weeklyRate = dailyRate * 7
  
  // Project future weight
  const projectedWeight = lastEntry.weight + (dailyRate * daysToProject)
  
  // Calculate days to reach target
  let daysToTarget: number | null = null
  if (targetWeight && dailyRate !== 0) {
    const remainingWeight = targetWeight - lastEntry.weight
    if ((remainingWeight > 0 && dailyRate > 0) || (remainingWeight < 0 && dailyRate < 0)) {
      daysToTarget = Math.abs(remainingWeight / dailyRate)
    }
  }
  
  // Check if rate is healthy (0.5-1kg per week is generally healthy)
  const isHealthyRate = Math.abs(weeklyRate) <= 1
  
  return {
    projectedWeight: Math.round(projectedWeight * 10) / 10,
    daysToTarget: daysToTarget ? Math.round(daysToTarget) : null,
    weeklyRate: Math.round(weeklyRate * 10) / 10,
    isHealthyRate,
  }
}

/**
 * Analyze calorie consistency
 */
export function analyzeCalorieConsistency(
  foodLogs: FoodLog[],
  targetCalories: number,
  days: number = 7
): {
  averageCalories: number
  standardDeviation: number
  consistencyScore: number // 0-100
  daysOnTarget: number
  daysOverTarget: number
  daysUnderTarget: number
} {
  // Group logs by date
  const caloriesByDate = new Map<string, number>()
  const today = new Date()
  
  // Initialize last N days (using local dates)
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const localDateKey = `${year}-${month}-${day}`
    caloriesByDate.set(localDateKey, 0)
  }
  
  // Sum calories by date (convert UTC timestamp to local date for grouping)
  foodLogs.forEach(log => {
    const utcDate = new Date(log.logged_at)
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000)
    const dateKey = localDate.toISOString().split('T')[0]
    if (caloriesByDate.has(dateKey)) {
      const current = caloriesByDate.get(dateKey) || 0
      caloriesByDate.set(dateKey, current + (log.calories_consumed || 0))
    }
  })
  
  const dailyCalories = Array.from(caloriesByDate.values())
  
  // Calculate average
  const averageCalories = dailyCalories.reduce((sum, cal) => sum + cal, 0) / days
  
  // Calculate standard deviation
  const variance = dailyCalories.reduce(
    (sum, cal) => sum + Math.pow(cal - averageCalories, 2),
    0
  ) / days
  const standardDeviation = Math.sqrt(variance)
  
  // Calculate consistency score (lower deviation = higher score)
  const maxAcceptableDeviation = targetCalories * 0.2 // 20% deviation
  const consistencyScore = Math.max(
    0,
    Math.min(100, 100 - (standardDeviation / maxAcceptableDeviation) * 100)
  )
  
  // Count days on/over/under target
  const tolerance = targetCalories * 0.1 // 10% tolerance
  let daysOnTarget = 0
  let daysOverTarget = 0
  let daysUnderTarget = 0
  
  dailyCalories.forEach(calories => {
    if (Math.abs(calories - targetCalories) <= tolerance) {
      daysOnTarget++
    } else if (calories > targetCalories) {
      daysOverTarget++
    } else {
      daysUnderTarget++
    }
  })
  
  return {
    averageCalories: Math.round(averageCalories),
    standardDeviation: Math.round(standardDeviation),
    consistencyScore: Math.round(consistencyScore),
    daysOnTarget,
    daysOverTarget,
    daysUnderTarget,
  }
}

/**
 * Calculate macro distribution and compare to recommended ratios
 */
export function analyzeMacroDistribution(
  totalProtein: number,
  totalCarbs: number,
  totalFat: number,
  goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance'
): {
  actualRatios: { protein: number; carbs: number; fat: number }
  recommendedRatios: { protein: number; carbs: number; fat: number }
  deviations: { protein: number; carbs: number; fat: number }
  score: number // 0-100
} {
  // Calculate actual ratios
  const totalCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9
  
  const actualRatios = {
    protein: totalCalories > 0 ? (totalProtein * 4 / totalCalories) * 100 : 0,
    carbs: totalCalories > 0 ? (totalCarbs * 4 / totalCalories) * 100 : 0,
    fat: totalCalories > 0 ? (totalFat * 9 / totalCalories) * 100 : 0,
  }
  
  // Define recommended ratios based on goal
  let recommendedRatios: { protein: number; carbs: number; fat: number }
  
  switch (goal) {
    case 'weight_loss':
      recommendedRatios = { protein: 30, carbs: 40, fat: 30 }
      break
    case 'muscle_gain':
      recommendedRatios = { protein: 35, carbs: 45, fat: 20 }
      break
    case 'weight_gain':
      recommendedRatios = { protein: 25, carbs: 50, fat: 25 }
      break
    default: // maintenance
      recommendedRatios = { protein: 25, carbs: 45, fat: 30 }
  }
  
  // Calculate deviations
  const deviations = {
    protein: actualRatios.protein - recommendedRatios.protein,
    carbs: actualRatios.carbs - recommendedRatios.carbs,
    fat: actualRatios.fat - recommendedRatios.fat,
  }
  
  // Calculate score (100 = perfect match, 0 = completely off)
  const totalDeviation = 
    Math.abs(deviations.protein) + 
    Math.abs(deviations.carbs) + 
    Math.abs(deviations.fat)
  const score = Math.max(0, 100 - totalDeviation)
  
  return {
    actualRatios: {
      protein: Math.round(actualRatios.protein),
      carbs: Math.round(actualRatios.carbs),
      fat: Math.round(actualRatios.fat),
    },
    recommendedRatios,
    deviations: {
      protein: Math.round(deviations.protein),
      carbs: Math.round(deviations.carbs),
      fat: Math.round(deviations.fat),
    },
    score: Math.round(score),
  }
}

/**
 * Generate insights and recommendations
 */
export function generateInsights(
  weightStats: ReturnType<typeof calculateWeightProjection>,
  calorieStats: ReturnType<typeof analyzeCalorieConsistency>,
  macroStats: ReturnType<typeof analyzeMacroDistribution>
): string[] {
  const insights: string[] = []
  
  // Weight insights
  if (!weightStats.isHealthyRate && Math.abs(weightStats.weeklyRate) > 1) {
    insights.push(
      `Your weight is changing at ${Math.abs(weightStats.weeklyRate)} kg/week. A healthy rate is 0.5-1 kg/week.`
    )
  }
  
  if (weightStats.daysToTarget) {
    const weeks = Math.round(weightStats.daysToTarget / 7)
    insights.push(
      `At your current rate, you'll reach your goal weight in approximately ${weeks} weeks.`
    )
  }
  
  // Calorie insights
  if (calorieStats.consistencyScore < 70) {
    insights.push(
      'Your calorie intake varies significantly day-to-day. Try to maintain more consistent eating habits.'
    )
  }
  
  if (calorieStats.daysOverTarget > calorieStats.days / 2) {
    insights.push(
      'You\'re frequently exceeding your calorie target. Consider reviewing your portion sizes.'
    )
  }
  
  if (calorieStats.daysUnderTarget > calorieStats.days / 2) {
    insights.push(
      'You\'re often under your calorie target. Make sure you\'re eating enough to support your goals.'
    )
  }
  
  // Macro insights
  if (Math.abs(macroStats.deviations.protein) > 10) {
    insights.push(
      macroStats.deviations.protein > 0
        ? 'Your protein intake is higher than recommended for your goal.'
        : 'Consider increasing your protein intake to support your fitness goals.'
    )
  }
  
  if (macroStats.score < 70) {
    insights.push(
      'Your macronutrient distribution could be better aligned with your goals. Review your meal choices.'
    )
  }
  
  return insights
}