import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLegend,
} from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface MacroTrendsChartProps {
  days?: number;
  showTargets?: boolean;
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '14D', value: '14' },
  { label: '30D', value: '30' },
];

export const MacroTrendsChart: React.FC<MacroTrendsChartProps> = ({
  days = 14,
  showTargets = true,
  height = 350,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [visibleMacros, setVisibleMacros] = useState({
    protein: true,
    carbs: true,
    fat: true,
  });
  
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { foodLogs, loading, error } = useFoodLogs();

  // Get macro targets from profile
  const targets = useMemo(() => {
    const totalCalories = profile?.target_calories || 2000;
    
    const proteinPercent = profile?.target_protein_percent || 25;
    const carbPercent = profile?.target_carb_percent || 45;
    const fatPercent = profile?.target_fat_percent || 30;
    
    return {
      protein: Math.round((totalCalories * proteinPercent / 100) / 4),
      carbs: Math.round((totalCalories * carbPercent / 100) / 4),
      fat: Math.round((totalCalories * fatPercent / 100) / 9),
    };
  }, [profile]);

  // Prepare trend data
  const trendData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    // Generate data for each day in the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter food logs for this date
      const dayLogs = foodLogs?.filter(log => {
        const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      }) || [];

      // Calculate total macros for the day
      const totals = dayLogs.reduce((acc, log) => {
        const food = log.food_item;
        const quantity = log.quantity || 0;
        
        if (food) {
          acc.protein += (food.protein || 0) * quantity;
          acc.carbs += (food.carbohydrates || 0) * quantity;
          acc.fat += (food.fat || 0) * quantity;
        }
        
        return acc;
      }, { protein: 0, carbs: 0, fat: 0 });

      const dayData = {
        date: date,
        x: format(date, 'MMM dd'),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      };

      data.push(dayData);
    }

    return data;
  }, [foodLogs, selectedPeriod]);

  // Separate data by macro type
  const chartData = useMemo(() => {
    return {
      protein: trendData.map(d => ({ 
        x: d.x, 
        y: d.protein, 
        date: d.date,
        label: `${chartFormatters.macros(d.protein)} protein`,
      })),
      carbs: trendData.map(d => ({ 
        x: d.x, 
        y: d.carbs, 
        date: d.date,
        label: `${chartFormatters.macros(d.carbs)} carbs`,
      })),
      fat: trendData.map(d => ({ 
        x: d.x, 
        y: d.fat, 
        date: d.date,
        label: `${chartFormatters.macros(d.fat)} fat`,
      })),
    };
  }, [trendData]);

  // Calculate Y axis domain
  const { minY, maxY } = useMemo(() => {
    const allValues = [
      ...chartData.protein.map(d => d.y),
      ...chartData.carbs.map(d => d.y),
      ...chartData.fat.map(d => d.y),
      ...(showTargets ? [targets.protein, targets.carbs, targets.fat] : []),
    ].filter(v => v > 0);

    if (allValues.length === 0) return { minY: 0, maxY: 100 };

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 10;

    return {
      minY: Math.max(0, Math.floor(min - padding)),
      maxY: Math.ceil(max + padding),
    };
  }, [chartData, targets, showTargets]);

  // Calculate averages
  const averages = useMemo(() => {
    if (trendData.length === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round(trendData.reduce((sum, d) => sum + d.protein, 0) / trendData.length),
      carbs: Math.round(trendData.reduce((sum, d) => sum + d.carbs, 0) / trendData.length),
      fat: Math.round(trendData.reduce((sum, d) => sum + d.fat, 0) / trendData.length),
    };
  }, [trendData]);

  const toggleMacroVisibility = (macro: keyof typeof visibleMacros) => {
    setVisibleMacros(prev => ({
      ...prev,
      [macro]: !prev[macro],
    }));
  };

  if (loading) {
    return (
      <ChartContainer
        title="Macro Trends"
        subtitle="Daily macro intake over time"
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Macro Trends"
        subtitle="Daily macro intake over time"
        error="Failed to load macro trend data"
        height={height}
      />
    );
  }

  const isEmpty = trendData.every(d => d.protein === 0 && d.carbs === 0 && d.fat === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Macro Trends"
        subtitle="Daily macro intake over time"
        height={height}
        actions={
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        }
      >
        <ChartEmptyState message="No macro data available for this period" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.max(screenWidth - 32, 350);

  return (
    <ChartContainer
      title="Macro Trends"
      subtitle="Daily macro intake over time"
      height={height}
      noPadding={true}
      actions={
        <ChartPeriodSelector
          periods={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16 }}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={height - 120}
            padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
            domain={{ y: [minY, maxY] }}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `${datum.label}\n${chartFormatters.dateFull(datum.date)}`}
                labelComponent={
                  <VictoryTooltip
                    cornerRadius={4}
                    flyoutStyle={{
                      stroke: chartTheme.tooltip.flyoutStyle.stroke,
                      fill: chartTheme.tooltip.flyoutStyle.fill,
                    }}
                    style={{
                      fontSize: 11,
                      fill: chartTheme.tooltip.style.fill,
                    }}
                  />
                }
              />
            }
          >
            {/* X Axis */}
            <VictoryAxis
              dependentAxis={false}
              style={{
                axis: chartTheme.axis.style.axis,
                tickLabels: {
                  ...chartTheme.axis.style.tickLabels,
                  angle: trendData.length > 7 ? -45 : 0,
                  textAnchor: trendData.length > 7 ? 'end' : 'middle',
                },
                grid: { stroke: 'transparent' },
              }}
              fixLabelOverlap={true}
            />
            
            {/* Y Axis */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: chartTheme.axis.style.axis,
                tickLabels: chartTheme.axis.style.tickLabels,
                grid: chartTheme.axis.style.grid,
              }}
              label="Grams"
              axisLabelComponent={
                <VictoryLabel
                  dy={-30}
                  style={chartTheme.axis.style.axisLabel}
                />
              }
            />
            
            {/* Target lines */}
            {showTargets && (
              <>
                {visibleMacros.protein && (
                  <VictoryLine
                    data={[
                      { x: chartData.protein[0]?.x, y: targets.protein },
                      { x: chartData.protein[chartData.protein.length - 1]?.x, y: targets.protein },
                    ]}
                    style={{
                      data: {
                        stroke: chartColors.macros.protein,
                        strokeWidth: 1,
                        strokeDasharray: '3,3',
                        opacity: 0.5,
                      },
                    }}
                  />
                )}
                {visibleMacros.carbs && (
                  <VictoryLine
                    data={[
                      { x: chartData.carbs[0]?.x, y: targets.carbs },
                      { x: chartData.carbs[chartData.carbs.length - 1]?.x, y: targets.carbs },
                    ]}
                    style={{
                      data: {
                        stroke: chartColors.macros.carbs,
                        strokeWidth: 1,
                        strokeDasharray: '3,3',
                        opacity: 0.5,
                      },
                    }}
                  />
                )}
                {visibleMacros.fat && (
                  <VictoryLine
                    data={[
                      { x: chartData.fat[0]?.x, y: targets.fat },
                      { x: chartData.fat[chartData.fat.length - 1]?.x, y: targets.fat },
                    ]}
                    style={{
                      data: {
                        stroke: chartColors.macros.fat,
                        strokeWidth: 1,
                        strokeDasharray: '3,3',
                        opacity: 0.5,
                      },
                    }}
                  />
                )}
              </>
            )}
            
            {/* Protein Line */}
            {visibleMacros.protein && (
              <>
                <VictoryLine
                  data={chartData.protein}
                  style={{
                    data: {
                      stroke: chartColors.macros.protein,
                      strokeWidth: 2,
                    },
                  }}
                  interpolation="monotoneX"
                  animate={{
                    duration: 800,
                    onLoad: { duration: 500 },
                  }}
                />
                <VictoryScatter
                  data={chartData.protein}
                  size={3}
                  style={{
                    data: {
                      fill: chartColors.macros.protein,
                      stroke: chartTheme.axis.style.axis.stroke,
                      strokeWidth: 1,
                    },
                  }}
                />
              </>
            )}
            
            {/* Carbs Line */}
            {visibleMacros.carbs && (
              <>
                <VictoryLine
                  data={chartData.carbs}
                  style={{
                    data: {
                      stroke: chartColors.macros.carbs,
                      strokeWidth: 2,
                    },
                  }}
                  interpolation="monotoneX"
                  animate={{
                    duration: 800,
                    onLoad: { duration: 500 },
                  }}
                />
                <VictoryScatter
                  data={chartData.carbs}
                  size={3}
                  style={{
                    data: {
                      fill: chartColors.macros.carbs,
                      stroke: chartTheme.axis.style.axis.stroke,
                      strokeWidth: 1,
                    },
                  }}
                />
              </>
            )}
            
            {/* Fat Line */}
            {visibleMacros.fat && (
              <>
                <VictoryLine
                  data={chartData.fat}
                  style={{
                    data: {
                      stroke: chartColors.macros.fat,
                      strokeWidth: 2,
                    },
                  }}
                  interpolation="monotoneX"
                  animate={{
                    duration: 800,
                    onLoad: { duration: 500 },
                  }}
                />
                <VictoryScatter
                  data={chartData.fat}
                  size={3}
                  style={{
                    data: {
                      fill: chartColors.macros.fat,
                      stroke: chartTheme.axis.style.axis.stroke,
                      strokeWidth: 1,
                    },
                  }}
                />
              </>
            )}
          </VictoryChart>
        </View>
      </ScrollView>
      
      {/* Interactive Legend */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: chartTheme.axis.style.axis.stroke,
      }}>
        {[
          { key: 'protein', label: 'Protein', color: chartColors.macros.protein },
          { key: 'carbs', label: 'Carbs', color: chartColors.macros.carbs },
          { key: 'fat', label: 'Fat', color: chartColors.macros.fat },
        ].map((macro) => (
          <View
            key={macro.key}
            style={{
              alignItems: 'center',
              marginHorizontal: 12,
              opacity: visibleMacros[macro.key as keyof typeof visibleMacros] ? 1 : 0.3,
            }}
            onTouchEnd={() => toggleMacroVisibility(macro.key as keyof typeof visibleMacros)}
          >
            <View style={{
              width: 12,
              height: 12,
              backgroundColor: macro.color,
              borderRadius: 6,
              marginBottom: 4,
            }} />
            <Text style={{
              fontSize: 11,
              color: chartTheme.axis.style.tickLabels.fill,
              textAlign: 'center',
            }}>
              {macro.label}
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: chartTheme.axis.style.axisLabel.fill,
              textAlign: 'center',
            }}>
              {averages[macro.key as keyof typeof averages]}g
            </Text>
            <Text style={{
              fontSize: 10,
              color: chartTheme.axis.style.tickLabels.fill,
              textAlign: 'center',
            }}>
              avg
            </Text>
          </View>
        ))}
      </View>
    </ChartContainer>
  );
};