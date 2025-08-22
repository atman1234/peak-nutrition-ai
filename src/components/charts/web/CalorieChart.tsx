import { useMemo } from 'react'
import { View, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/auth/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { getLocalDateFromUTC, getLocalDateRangeForQuery } from '@/lib/date-utils'
import { ChartWrapper, useChartTheme } from './ChartWrapper'

interface CalorieChartProps {
  days?: number // Number of days to show (default: 7)
  showTarget?: boolean
}

export function CalorieChart({ days = 7, showTarget = true }: CalorieChartProps) {
  const { user } = useAuthContext()
  const { profile } = useProfile()
  const chartTheme = useChartTheme()

  // Calculate date range for the query
  const dateRange = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    
    // Format dates for the query
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    
    // Get UTC ranges for each day
    const { start } = getLocalDateRangeForQuery(startDateStr)
    const { end } = getLocalDateRangeForQuery(endDateStr)
    
    return { start, end }
  }, [days])

  // Fetch food logs for the date range
  const { data: foodLogs = [] } = useQuery({
    queryKey: ['calorie-chart-logs', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dateRange.start)
        .lt('logged_at', dateRange.end)
        .order('logged_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const chartData = useMemo(() => {

    // Create a map of local dates to calories
    const caloriesByDate = new Map<string, number>()
    
    // Initialize the last N days with 0 calories (using local dates)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const localDateKey = `${year}-${month}-${day}`
      caloriesByDate.set(localDateKey, 0)
    }

    // Sum calories for each day (group by local date)
    foodLogs.forEach(log => {
      // Convert UTC timestamp to local date for grouping
      const localDateKey = getLocalDateFromUTC(log.logged_at)
      
      // Add to the existing date or create new entry
      const currentCalories = caloriesByDate.get(localDateKey) || 0
      caloriesByDate.set(localDateKey, currentCalories + (log.calories_consumed || 0))
    })

    // Convert to array format for chart
    return Array.from(caloriesByDate.entries()).map(([date, calories]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      }),
      calories: Math.round(calories),
      target: profile?.daily_calorie_target || 2000,
    }))
  }, [foodLogs, days, profile])

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <p>No calorie data available for the selected period</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const calories = payload[0].value
      const target = profile?.daily_calorie_target || 2000
      const difference = calories - target
      const percentage = ((calories / target) * 100).toFixed(1)

      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-midnight dark:text-white mb-2">{label}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Consumed: <span className="font-semibold text-gold">{calories} cal</span>
          </p>
          {showTarget && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Target: <span className="font-semibold">{target} cal</span>
              </p>
              <p className={`text-sm font-medium mt-1 ${
                Math.abs(difference) < 100 
                  ? 'text-green-600 dark:text-green-400'
                  : difference > 0 
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {difference > 0 ? '+' : ''}{difference} cal ({percentage}%)
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  const target = profile?.daily_calorie_target || 2000

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {showTarget && (
          <ReferenceLine 
            y={target} 
            stroke="#10b981" 
            strokeDasharray="5 5"
            label={{ value: "Target", position: "right", fill: '#10b981' }}
          />
        )}
        
        <Bar
          dataKey="calories"
          fill="#f59e0b"
          name="Calories"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}