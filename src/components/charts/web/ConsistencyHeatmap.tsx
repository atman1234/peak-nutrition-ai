/**
 * Calendar-style heatmap showing daily goal achievement levels
 * Features: GitHub-style contribution grid, hover tooltips, legend
 */

import { useState, useMemo } from 'react'
import { useHistoricalAnalytics, useTimePeriodUtils } from '@/hooks/useHistoricalAnalytics'
import type { TimePeriod, HeatmapData } from '@/types/historical-analytics'
import { Calendar, Info, Target, TrendingUp } from 'lucide-react'

interface ConsistencyHeatmapProps {
  defaultTimePeriod?: TimePeriod
  showLegend?: boolean
  height?: number
}

const ACHIEVEMENT_LEVELS = {
  0: { color: 'bg-slate-100 dark:bg-slate-800', label: 'No data', border: 'border-slate-200 dark:border-slate-700' },
  1: { color: 'bg-red-100 dark:bg-red-900/30', label: 'Poor (0-25%)', border: 'border-red-200 dark:border-red-700' },
  2: { color: 'bg-orange-200 dark:bg-orange-900/40', label: 'Fair (25-50%)', border: 'border-orange-300 dark:border-orange-600' },
  3: { color: 'bg-yellow-300 dark:bg-yellow-900/50', label: 'Good (50-75%)', border: 'border-yellow-400 dark:border-yellow-500' },
  4: { color: 'bg-emerald-300 dark:bg-emerald-900/60', label: 'Excellent (75%+)', border: 'border-emerald-400 dark:border-emerald-500' }
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ConsistencyHeatmap({ 
  defaultTimePeriod = '90d',
  showLegend = true,
  height = 200
}: ConsistencyHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(defaultTimePeriod)

  const config = {
    timePeriod,
    includeStreaks: false,
    includeConsistency: true,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'] as const
  }

  const { historicalMetrics, chartData, isLoading, error } = useHistoricalAnalytics(config)
  const { getTimePeriodOptions } = useTimePeriodUtils()

  // Generate calendar grid data
  const calendarData = useMemo(() => {
    if (!chartData?.heatmap) return { weeks: [], months: [] }

    const heatmapData = chartData.heatmap
    const dataMap = new Map(heatmapData.map(d => [d.date, d]))

    // Get date range
    const startDate = new Date(heatmapData[0]?.date || new Date())
    const endDate = new Date(heatmapData[heatmapData.length - 1]?.date || new Date())

    // Start from the beginning of the week containing startDate
    const calendarStart = new Date(startDate)
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())

    // End at the end of the week containing endDate
    const calendarEnd = new Date(endDate)
    calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()))

    const weeks: Array<Array<{ date: string; level: 0 | 1 | 2 | 3 | 4; value: number }>> = []
    const months: Array<{ name: string; weekIndex: number }> = []

    let currentWeek: Array<{ date: string; level: 0 | 1 | 2 | 3 | 4; value: number }> = []
    let currentMonth = calendarStart.getMonth()
    let weekIndex = 0

    // Add initial month
    months.push({
      name: MONTH_LABELS[currentMonth],
      weekIndex: 0
    })

    for (let d = new Date(calendarStart); d <= calendarEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const data = dataMap.get(dateStr)
      
      currentWeek.push({
        date: dateStr,
        level: data?.level || 0,
        value: data?.value || 0
      })

      // Check for month change
      if (d.getMonth() !== currentMonth && currentWeek.length === 1) {
        currentMonth = d.getMonth()
        months.push({
          name: MONTH_LABELS[currentMonth],
          weekIndex: weekIndex
        })
      }

      // Complete week (Sunday to Saturday)
      if (d.getDay() === 6) {
        weeks.push(currentWeek)
        currentWeek = []
        weekIndex++
      }
    }

    // Add incomplete week if exists
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return { weeks, months }
  }, [chartData])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!chartData?.heatmap) return null

    const data = chartData.heatmap
    const totalDays = data.length
    const excellentDays = data.filter(d => d.level === 4).length
    const goodDays = data.filter(d => d.level >= 3).length
    const averageScore = data.length > 0 
      ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)
      : 0

    return {
      totalDays,
      excellentDays,
      goodDays,
      averageScore,
      excellentRate: totalDays > 0 ? Math.round((excellentDays / totalDays) * 100) : 0,
      goodRate: totalDays > 0 ? Math.round((goodDays / totalDays) * 100) : 0
    }
  }, [chartData])

  // Find selected date data
  const selectedDateData = useMemo(() => {
    if (!selectedDate || !historicalMetrics) return null
    
    return historicalMetrics.dailyGoals.find(d => d.date === selectedDate)
  }, [selectedDate, historicalMetrics])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ height }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Failed to load consistency data. Please try again.
        </p>
      </div>
    )
  }

  if (!chartData?.heatmap || calendarData.weeks.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Consistency Data Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Start logging your food to see your consistency heatmap.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-midnight dark:text-white">
            Consistency Heatmap
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Period Selector */}
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="input-elegant py-1 px-2 text-sm"
          >
            {getTimePeriodOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Average Score</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {summaryStats.averageScore}%
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Excellent Days</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {summaryStats.excellentDays} ({summaryStats.excellentRate}%)
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Good+ Days</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {summaryStats.goodDays} ({summaryStats.goodRate}%)
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Days</p>
            <p className="text-lg font-semibold text-midnight dark:text-white">
              {summaryStats.totalDays}
            </p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-6"></div> {/* Space for day labels */}
            <div className="flex">
              {calendarData.months.map((month, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-600 dark:text-slate-400 font-medium px-2"
                  style={{
                    marginLeft: index === 0 ? `${month.weekIndex * 12}px` : `${(month.weekIndex - (calendarData.months[index - 1]?.weekIndex || 0)) * 12}px`
                  }}
                >
                  {month.name}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-2">
              {DAY_LABELS.map((day, index) => (
                <div
                  key={day}
                  className={`h-3 flex items-center text-xs text-slate-600 dark:text-slate-400 ${
                    index % 2 === 0 ? '' : 'opacity-0'
                  }`}
                  style={{ marginBottom: '2px' }}
                >
                  {index % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex">
              {calendarData.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col mr-1">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                    const dayData = week[dayIndex]
                    const level = dayData?.level || 0
                    const levelConfig = ACHIEVEMENT_LEVELS[level]
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm border cursor-pointer transition-all duration-200 hover:scale-110
                          ${levelConfig.color} ${levelConfig.border}
                          ${selectedDate === dayData?.date ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                        `}
                        style={{ marginBottom: '2px' }}
                        onClick={() => setSelectedDate(dayData?.date || null)}
                        title={dayData ? `${new Date(dayData.date).toLocaleDateString()}: ${Math.round(dayData.value)}%` : 'No data'}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400">Less</span>
            <div className="flex space-x-1">
              {Object.entries(ACHIEVEMENT_LEVELS).map(([level, config]) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm border ${config.color} ${config.border}`}
                  title={config.label}
                />
              ))}
            </div>
            <span className="text-slate-600 dark:text-slate-400">More</span>
          </div>
          
          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
            <Info className="h-3 w-3" />
            <span>Click squares for details</span>
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && selectedDateData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {Math.round(selectedDateData.overallScore)}% Overall
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">Calories</p>
              <p className="text-sm font-medium">
                {Math.round(selectedDateData.calories.actual)} / {Math.round(selectedDateData.calories.target)}
                <span className="text-xs text-slate-500 ml-1">
                  ({Math.round(selectedDateData.calories.percentage)}%)
                </span>
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">Protein</p>
              <p className="text-sm font-medium">
                {Math.round(selectedDateData.protein.actual)}g / {Math.round(selectedDateData.protein.target)}g
                <span className="text-xs text-slate-500 ml-1">
                  ({Math.round(selectedDateData.protein.percentage)}%)
                </span>
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">Carbs</p>
              <p className="text-sm font-medium">
                {Math.round(selectedDateData.carbs.actual)}g / {Math.round(selectedDateData.carbs.target)}g
                <span className="text-xs text-slate-500 ml-1">
                  ({Math.round(selectedDateData.carbs.percentage)}%)
                </span>
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">Fat</p>
              <p className="text-sm font-medium">
                {Math.round(selectedDateData.fat.actual)}g / {Math.round(selectedDateData.fat.target)}g
                <span className="text-xs text-slate-500 ml-1">
                  ({Math.round(selectedDateData.fat.percentage)}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}