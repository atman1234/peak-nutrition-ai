/**
 * Stacked bar chart showing daily macro targets vs actual
 * Features: Weekly/monthly views, macro selection, comparison modes
 */

import React, { useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useHistoricalAnalytics, useTimePeriodUtils } from '@/hooks/useHistoricalAnalytics'
import type { TimePeriod, MacroType } from '@/types/historical-analytics'
import { 
  BarChart3, 
  Calendar, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react'

interface MacroTrendsChartProps {
  defaultTimePeriod?: TimePeriod
  showConsistencyScore?: boolean
  height?: number
}

type ViewMode = 'targets-vs-actual' | 'achievement-percentage' | 'consistency'

const MACRO_COLORS = {
  protein: {
    target: '#10b981',
    actual: '#34d399',
    light: '#a7f3d0'
  },
  carbs: {
    target: '#3b82f6',
    actual: '#60a5fa',
    light: '#bfdbfe'
  },
  fat: {
    target: '#8b5cf6',
    actual: '#a78bfa',
    light: '#ddd6fe'
  }
}

const MACRO_LABELS = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat'
}

export function MacroTrendsChart({ 
  defaultTimePeriod = '30d',
  showConsistencyScore = true,
  height = 400
}: MacroTrendsChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(defaultTimePeriod)
  const [viewMode, setViewMode] = useState<ViewMode>('targets-vs-actual')
  const [visibleMacros, setVisibleMacros] = useState<Set<MacroType>>(
    new Set(['protein', 'carbs', 'fat'])
  )

  const config = {
    timePeriod,
    includeStreaks: false,
    includeConsistency: showConsistencyScore,
    includeTrends: false,
    includeComparisons: false,
    goalTypes: ['calories', 'protein', 'carbs', 'fat'] as const
  }

  const { historicalMetrics, chartData, isLoading, error } = useHistoricalAnalytics(config)
  const { getTimePeriodOptions } = useTimePeriodUtils()

  // Format data based on view mode
  const formattedChartData = useMemo(() => {
    if (!chartData?.macroTrends) return []

    return chartData.macroTrends.map(day => {
      const date = new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })

      if (viewMode === 'achievement-percentage') {
        return {
          date,
          proteinAchievement: day.proteinTarget > 0 ? Math.round((day.proteinActual / day.proteinTarget) * 100) : 0,
          carbsAchievement: day.carbsTarget > 0 ? Math.round((day.carbsActual / day.carbsTarget) * 100) : 0,
          fatAchievement: day.fatTarget > 0 ? Math.round((day.fatActual / day.fatTarget) * 100) : 0,
        }
      }

      return {
        date,
        proteinTarget: Math.round(day.proteinTarget),
        proteinActual: Math.round(day.proteinActual),
        carbsTarget: Math.round(day.carbsTarget),
        carbsActual: Math.round(day.carbsActual),
        fatTarget: Math.round(day.fatTarget),
        fatActual: Math.round(day.fatActual),
      }
    })
  }, [chartData, viewMode])

  // Calculate consistency metrics
  const consistencyMetrics = useMemo(() => {
    if (!historicalMetrics?.consistency) return null

    const metrics = historicalMetrics.consistency.reduce((acc, score) => {
      if (score.goalType !== 'calories') {
        acc[score.goalType as MacroType] = score
      }
      return acc
    }, {} as Record<MacroType, any>)

    return metrics
  }, [historicalMetrics])

  // Toggle macro visibility
  const toggleMacroVisibility = (macro: MacroType) => {
    const newVisible = new Set(visibleMacros)
    if (newVisible.has(macro)) {
      newVisible.delete(macro)
    } else {
      newVisible.add(macro)
    }
    setVisibleMacros(newVisible)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-midnight dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{viewMode === 'achievement-percentage' ? '%' : 'g'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ height }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Failed to load macro trends data. Please try again.
        </p>
      </div>
    )
  }

  if (!formattedChartData.length) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Macro Data Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Start logging your food to see macro trends.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-semibold text-midnight dark:text-white">
            Macro Trends Analysis
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="input-elegant py-1 px-2 text-sm"
          >
            <option value="targets-vs-actual">Targets vs Actual</option>
            <option value="achievement-percentage">Achievement %</option>
          </select>

          {/* Time Period Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
      </div>

      {/* Macro Toggle Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Show:</span>
        {Object.entries(MACRO_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleMacroVisibility(key as MacroType)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              visibleMacros.has(key as MacroType)
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-700'
            }`}
          >
            {visibleMacros.has(key as MacroType) ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            <span style={{ 
              color: visibleMacros.has(key as MacroType) 
                ? MACRO_COLORS[key as MacroType].target 
                : undefined 
            }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={formattedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${value}${viewMode === 'achievement-percentage' ? '%' : 'g'}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {viewMode === 'achievement-percentage' && (
              <ReferenceLine 
                y={100} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeOpacity={0.6}
              />
            )}

            {/* Protein */}
            {visibleMacros.has('protein') && (
              <>
                {viewMode === 'targets-vs-actual' ? (
                  <>
                    <Bar 
                      dataKey="proteinTarget" 
                      fill={MACRO_COLORS.protein.target}
                      name="Protein Target"
                      opacity={0.7}
                    />
                    <Bar 
                      dataKey="proteinActual" 
                      fill={MACRO_COLORS.protein.actual}
                      name="Protein Actual"
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="proteinAchievement"
                    stroke={MACRO_COLORS.protein.target}
                    strokeWidth={2}
                    dot={{ fill: MACRO_COLORS.protein.target, strokeWidth: 0, r: 3 }}
                    name="Protein Achievement"
                  />
                )}
              </>
            )}

            {/* Carbs */}
            {visibleMacros.has('carbs') && (
              <>
                {viewMode === 'targets-vs-actual' ? (
                  <>
                    <Bar 
                      dataKey="carbsTarget" 
                      fill={MACRO_COLORS.carbs.target}
                      name="Carbs Target"
                      opacity={0.7}
                    />
                    <Bar 
                      dataKey="carbsActual" 
                      fill={MACRO_COLORS.carbs.actual}
                      name="Carbs Actual"
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="carbsAchievement"
                    stroke={MACRO_COLORS.carbs.target}
                    strokeWidth={2}
                    dot={{ fill: MACRO_COLORS.carbs.target, strokeWidth: 0, r: 3 }}
                    name="Carbs Achievement"
                  />
                )}
              </>
            )}

            {/* Fat */}
            {visibleMacros.has('fat') && (
              <>
                {viewMode === 'targets-vs-actual' ? (
                  <>
                    <Bar 
                      dataKey="fatTarget" 
                      fill={MACRO_COLORS.fat.target}
                      name="Fat Target"
                      opacity={0.7}
                    />
                    <Bar 
                      dataKey="fatActual" 
                      fill={MACRO_COLORS.fat.actual}
                      name="Fat Actual"
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="fatAchievement"
                    stroke={MACRO_COLORS.fat.target}
                    strokeWidth={2}
                    dot={{ fill: MACRO_COLORS.fat.target, strokeWidth: 0, r: 3 }}
                    name="Fat Achievement"
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Consistency Scores */}
      {showConsistencyScore && consistencyMetrics && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-midnight dark:text-white">
            Consistency Scores
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(consistencyMetrics).map(([macro, score]) => {
              const trendIcon = score.trend === 'improving' ? TrendingUp : 
                              score.trend === 'declining' ? TrendingDown : Minus
              const trendColor = score.trend === 'improving' ? 'text-emerald-500' :
                               score.trend === 'declining' ? 'text-red-500' : 'text-slate-500'
              
              return (
                <div key={macro} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {MACRO_LABELS[macro as MacroType]}
                    </span>
                    <div className={`flex items-center space-x-1 ${trendColor}`}>
                      {React.createElement(trendIcon, { className: 'h-4 w-4' })}
                      <span className="text-sm capitalize">{score.trend}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Score:</span>
                      <span className="text-sm font-semibold">{Math.round(score.score)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Achievement:</span>
                      <span className="text-sm">{score.achievedDays}/{score.totalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Avg:</span>
                      <span className="text-sm">{Math.round(score.averagePercentage)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}