import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useProfile } from '@/hooks/useProfile'

interface MacroChartProps {
  chartType?: 'pie' | 'bar' | 'advanced'
  showTargets?: boolean
}

const MACRO_COLORS = {
  protein: '#10b981', // emerald
  carbs: '#3b82f6',   // blue
  fat: '#f59e0b',     // amber
}

export function MacroChart({ chartType = 'pie', showTargets = true }: MacroChartProps) {
  const { dailySummary } = useFoodLogs()
  const { profile } = useProfile()

  const macroData = useMemo(() => {
    const { totalProtein, totalCarbs, totalFat } = dailySummary

    if (chartType === 'pie') {
      // For pie chart, show distribution
      const total = totalProtein * 4 + totalCarbs * 4 + totalFat * 9 // Convert to calories
      if (total === 0) return []

      return [
        { 
          name: 'Protein', 
          value: Math.round((totalProtein * 4 / total) * 100),
          grams: Math.round(totalProtein),
          calories: Math.round(totalProtein * 4)
        },
        { 
          name: 'Carbs', 
          value: Math.round((totalCarbs * 4 / total) * 100),
          grams: Math.round(totalCarbs),
          calories: Math.round(totalCarbs * 4)
        },
        { 
          name: 'Fat', 
          value: Math.round((totalFat * 9 / total) * 100),
          grams: Math.round(totalFat),
          calories: Math.round(totalFat * 9)
        },
      ]
    } else {
      // For bar chart and advanced view, show actual vs target
      const proteinTarget = profile?.protein_target_g || 150
      const carbTarget = profile?.carb_target_g || 250
      const fatTarget = profile?.fat_target_g || 67
      
      const totalConsumedCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9
      const totalTargetCalories = proteinTarget * 4 + carbTarget * 4 + fatTarget * 9
      
      return [
        {
          name: 'Protein',
          current: Math.round(totalProtein),
          target: proteinTarget,
          percentage: proteinTarget 
            ? Math.round((totalProtein / proteinTarget) * 100)
            : 0,
          calories: Math.round(totalProtein * 4),
          targetCalories: Math.round(proteinTarget * 4),
          ratioOfTotal: totalConsumedCalories > 0 ? Math.round((totalProtein * 4 / totalConsumedCalories) * 100) : 0,
          targetRatioOfTotal: totalTargetCalories > 0 ? Math.round((proteinTarget * 4 / totalTargetCalories) * 100) : 0,
          color: MACRO_COLORS.protein
        },
        {
          name: 'Carbs',
          current: Math.round(totalCarbs),
          target: carbTarget,
          percentage: carbTarget 
            ? Math.round((totalCarbs / carbTarget) * 100)
            : 0,
          calories: Math.round(totalCarbs * 4),
          targetCalories: Math.round(carbTarget * 4),
          ratioOfTotal: totalConsumedCalories > 0 ? Math.round((totalCarbs * 4 / totalConsumedCalories) * 100) : 0,
          targetRatioOfTotal: totalTargetCalories > 0 ? Math.round((carbTarget * 4 / totalTargetCalories) * 100) : 0,
          color: MACRO_COLORS.carbs
        },
        {
          name: 'Fat',
          current: Math.round(totalFat),
          target: fatTarget,
          percentage: fatTarget 
            ? Math.round((totalFat / fatTarget) * 100)
            : 0,
          calories: Math.round(totalFat * 9),
          targetCalories: Math.round(fatTarget * 9),
          ratioOfTotal: totalConsumedCalories > 0 ? Math.round((totalFat * 9 / totalConsumedCalories) * 100) : 0,
          targetRatioOfTotal: totalTargetCalories > 0 ? Math.round((fatTarget * 9 / totalTargetCalories) * 100) : 0,
          color: MACRO_COLORS.fat
        },
      ]
    }
  }, [dailySummary, profile, chartType])

  if (macroData.length === 0 || (chartType === 'pie' && macroData.every(d => d.value === 0))) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <p>No macro data available for today</p>
      </div>
    )
  }

  // Advanced view with horizontal progress bars
  if (chartType === 'advanced') {
    return (
      <div className="space-y-6 p-2">
        {macroData.map((macro) => {
          const progressWidth = Math.min(macro.percentage, 100)
          const isOnTarget = macro.percentage >= 90 && macro.percentage <= 110
          const isOver = macro.percentage > 110
          
          return (
            <div key={macro.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {macro.name}
                </h3>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {macro.current}g
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">
                    / {macro.target}g
                  </span>
                </div>
              </div>
              
              <div className="relative">
                {/* Background track */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  {/* Progress fill */}
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isOnTarget 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : isOver 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ 
                      width: `${progressWidth}%`,
                      backgroundColor: progressWidth === 0 ? 'transparent' : undefined
                    }}
                  />
                  
                  {/* Glow effect for completed bars */}
                  {progressWidth > 80 && (
                    <div 
                      className={`absolute top-0 h-full rounded-full opacity-40 blur-sm ${
                        isOnTarget ? 'bg-emerald-400' : isOver ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${progressWidth}%` }}
                    />
                  )}
                </div>
                
                {/* Target line */}
                <div className="absolute top-0 w-0.5 h-3 bg-slate-400 dark:bg-slate-500" style={{ left: '100%' }} />
              </div>
              
              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-4">
                  <span className={`font-medium ${
                    isOnTarget 
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isOver 
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {macro.percentage}% of target
                  </span>
                  <span>•</span>
                  <span>{macro.calories} cal</span>
                  <span>•</span>
                  <span>{macro.ratioOfTotal}% of total</span>
                </div>
                
                <div className="text-slate-500 dark:text-slate-500">
                  Target: {macro.targetRatioOfTotal}% ratio
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Summary section */}
        <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {macroData.reduce((sum, m) => sum + m.calories, 0)}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Total Calories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round(macroData.reduce((sum, m) => sum + m.percentage, 0) / 3)}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Avg Target Hit</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {macroData.filter(m => m.percentage >= 90 && m.percentage <= 110).length}/3
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">On Target</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      if (chartType === 'pie') {
        return (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-midnight dark:text-white">{data.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {data.value}% of calories
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {data.grams}g ({data.calories} cal)
            </p>
          </div>
        )
      } else {
        return (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-midnight dark:text-white">{data.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current: <span className="font-semibold">{data.current}g</span>
            </p>
            {showTargets && (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Target: <span className="font-semibold">{data.target}g</span>
                </p>
                <p className={`text-sm font-medium ${
                  data.percentage >= 90 && data.percentage <= 110
                    ? 'text-green-600 dark:text-green-400'
                    : data.percentage > 110
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {data.percentage}% of target
                </p>
              </>
            )}
          </div>
        )
      }
    }
    return null
  }

  const renderCustomLabel = (data: any) => {
    return `${data.name}: ${data.value}%`
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={macroData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {macroData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={MACRO_COLORS[entry.name.toLowerCase() as keyof typeof MACRO_COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={macroData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `${value}g`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        <Bar
          dataKey="current"
          fill="#f59e0b"
          name="Current"
          radius={[4, 4, 0, 0]}
        />
        
        {showTargets && (
          <Bar
            dataKey="target"
            fill="#10b981"
            name="Target"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.3}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}