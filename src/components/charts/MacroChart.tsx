import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text } from 'react-native';
import {
  VictoryPie,
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryContainer,
  VictoryTooltip,
  VictoryLegend,
} from 'victory-native';
import { format, startOfDay } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface MacroChartProps {
  date?: Date;
  chartType?: 'pie' | 'bar';
  showTargets?: boolean;
  height?: number;
}

export const MacroChart: React.FC<MacroChartProps> = ({
  date = new Date(),
  chartType: initialChartType = 'pie',
  showTargets = true,
  height = 350,
}) => {
  const [chartType, setChartType] = useState(initialChartType);
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { foodLogs, loading, error } = useFoodLogs();

  // Get macro targets from profile
  const targets = useMemo(() => {
    const totalCalories = profile?.target_calories || 2000;
    
    // Default macro percentages if not set in profile
    const proteinPercent = profile?.target_protein_percent || 25;
    const carbPercent = profile?.target_carb_percent || 45;
    const fatPercent = profile?.target_fat_percent || 30;
    
    return {
      protein: Math.round((totalCalories * proteinPercent / 100) / 4), // 4 cal per gram
      carbs: Math.round((totalCalories * carbPercent / 100) / 4), // 4 cal per gram
      fat: Math.round((totalCalories * fatPercent / 100) / 9), // 9 cal per gram
    };
  }, [profile]);

  // Calculate macro data for the selected date
  const macroData = useMemo(() => {
    const today = format(startOfDay(date), 'yyyy-MM-dd');
    
    // Filter food logs for the selected date
    const dayLogs = foodLogs?.filter(log => {
      const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
      return logDate === today;
    }) || [];

    // Calculate total macros for the day
    const totals = dayLogs.reduce((acc, log) => {
      const food = log.food_item;
      const quantity = log.quantity || 0;
      
      if (food) {
        acc.protein += (food.protein || 0) * quantity;
        acc.carbs += (food.carbohydrates || 0) * quantity;
        acc.fat += (food.fat || 0) * quantity;
        acc.calories += (food.calories || 0) * quantity;
      }
      
      return acc;
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

    // Calculate percentages
    const totalMacroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
    
    return {
      actual: {
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        calories: Math.round(totals.calories),
      },
      percentages: totalMacroCalories > 0 ? {
        protein: Math.round((totals.protein * 4) / totalMacroCalories * 100),
        carbs: Math.round((totals.carbs * 4) / totalMacroCalories * 100),
        fat: Math.round((totals.fat * 9) / totalMacroCalories * 100),
      } : { protein: 0, carbs: 0, fat: 0 },
    };
  }, [foodLogs, date]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    const { actual } = macroData;
    const total = (actual.protein * 4) + (actual.carbs * 4) + (actual.fat * 9);
    
    if (total === 0) return [];
    
    return [
      {
        x: 'Protein',
        y: actual.protein * 4,
        grams: actual.protein,
        percentage: Math.round((actual.protein * 4) / total * 100),
        color: chartColors.macros.protein,
      },
      {
        x: 'Carbs',
        y: actual.carbs * 4,
        grams: actual.carbs,
        percentage: Math.round((actual.carbs * 4) / total * 100),
        color: chartColors.macros.carbs,
      },
      {
        x: 'Fat',
        y: actual.fat * 9,
        grams: actual.fat,
        percentage: Math.round((actual.fat * 9) / total * 100),
        color: chartColors.macros.fat,
      },
    ].filter(item => item.y > 0);
  }, [macroData, chartColors]);

  // Prepare bar chart data
  const barData = useMemo(() => {
    const { actual } = macroData;
    
    return [
      {
        x: 'Protein',
        y: actual.protein,
        target: targets.protein,
        color: chartColors.macros.protein,
        percentage: targets.protein > 0 ? Math.round((actual.protein / targets.protein) * 100) : 0,
      },
      {
        x: 'Carbs',
        y: actual.carbs,
        target: targets.carbs,
        color: chartColors.macros.carbs,
        percentage: targets.carbs > 0 ? Math.round((actual.carbs / targets.carbs) * 100) : 0,
      },
      {
        x: 'Fat',
        y: actual.fat,
        target: targets.fat,
        color: chartColors.macros.fat,
        percentage: targets.fat > 0 ? Math.round((actual.fat / targets.fat) * 100) : 0,
      },
    ];
  }, [macroData, targets, chartColors]);

  // Calculate max Y for bar chart
  const maxY = useMemo(() => {
    const maxActual = Math.max(...barData.map(d => d.y));
    const maxTarget = Math.max(...barData.map(d => d.target));
    const max = Math.max(maxActual, maxTarget);
    return Math.ceil(max / 10) * 10; // Round up to nearest 10
  }, [barData]);

  if (loading) {
    return (
      <ChartContainer
        title="Macro Distribution"
        subtitle={format(date, 'MMMM dd, yyyy')}
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Macro Distribution"
        subtitle={format(date, 'MMMM dd, yyyy')}
        error="Failed to load macro data"
        height={height}
      />
    );
  }

  const isEmpty = macroData.actual.protein === 0 && 
                  macroData.actual.carbs === 0 && 
                  macroData.actual.fat === 0;

  if (isEmpty) {
    return (
      <ChartContainer
        title="Macro Distribution"
        subtitle={format(date, 'MMMM dd, yyyy')}
        height={height}
        actions={
          <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
            <TouchableOpacity
              onPress={() => setChartType('pie')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'pie' ? chartColors.macros.protein : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'pie' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
              }}>
                Pie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChartType('bar')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: chartType === 'bar' ? chartColors.macros.protein : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500',
                color: chartType === 'bar' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
              }}>
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        }
      >
        <ChartEmptyState message="No macro data available for this date" />
      </ChartContainer>
    );
  }

  const chartWidth = Math.min(screenWidth - 64, 350);

  return (
    <ChartContainer
      title="Macro Distribution"
      subtitle={format(date, 'MMMM dd, yyyy')}
      height={height}
      noPadding={chartType === 'pie'}
      actions={
        <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
          <TouchableOpacity
            onPress={() => setChartType('pie')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: chartType === 'pie' ? chartColors.macros.protein : 'transparent',
            }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500',
              color: chartType === 'pie' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
            }}>
              Pie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartType('bar')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: chartType === 'bar' ? chartColors.macros.protein : 'transparent',
            }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500',
              color: chartType === 'bar' ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
            }}>
              Bar
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      {chartType === 'pie' ? (
        <View style={{ alignItems: 'center' }}>
          <VictoryPie
            data={pieData}
            width={chartWidth}
            height={height - 100}
            colorScale={pieData.map(d => d.color)}
            innerRadius={60}
            padAngle={2}
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
            labelFormat={({ datum }) => `${datum.x}\n${datum.grams}g (${datum.percentage}%)`}
            animate={{
              duration: 800,
              onLoad: { duration: 500 },
            }}
          />
          
          {/* Center label */}
          <View style={{
            position: 'absolute',
            top: (height - 100) / 2 - 20,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: chartTheme.axis.style.axisLabel.fill,
            }}>
              {chartFormatters.calories(macroData.actual.calories)}
            </Text>
            <Text style={{
              fontSize: 12,
              color: chartTheme.axis.style.tickLabels.fill,
            }}>
              Total
            </Text>
          </View>

          {/* Legend */}
          <ChartLegend
            data={pieData.map(d => ({
              label: d.x,
              color: d.color,
              value: `${d.grams}g (${d.percentage}%)`,
            }))}
            horizontal={true}
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={height - 80}
            padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
            domain={{ y: [0, maxY] }}
          >
            {/* X Axis */}
            <VictoryAxis
              dependentAxis={false}
              style={{
                axis: chartTheme.axis.style.axis,
                tickLabels: chartTheme.axis.style.tickLabels,
                grid: { stroke: 'transparent' },
              }}
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
            {showTargets && barData.map((item, index) => (
              <VictoryBar
                key={`target-${index}`}
                data={[{ x: item.x, y: item.target }]}
                style={{
                  data: {
                    fill: 'transparent',
                    stroke: item.color,
                    strokeWidth: 2,
                    strokeDasharray: '3,3',
                  },
                }}
                barWidth={40}
              />
            ))}
            
            {/* Actual bars */}
            <VictoryBar
              data={barData}
              style={{
                data: {
                  fill: ({ datum }) => datum.color,
                },
              }}
              barWidth={30}
              cornerRadius={{ top: 4 }}
              labelComponent={
                <VictoryLabel
                  dy={-5}
                  style={{
                    fontSize: 10,
                    fill: chartTheme.axis.style.tickLabels.fill,
                    fontWeight: '500',
                  }}
                />
              }
              labelFormat={({ datum }) => `${datum.y}g`}
              animate={{
                duration: 800,
                onLoad: { duration: 500 },
              }}
            />
          </VictoryChart>

          {/* Summary stats */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: chartTheme.axis.style.axis.stroke,
          }}>
            {barData.map((item) => (
              <View key={item.x} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color,
                  borderRadius: 6,
                  marginBottom: 4,
                }} />
                <Text style={{
                  fontSize: 11,
                  color: chartTheme.axis.style.tickLabels.fill,
                  textAlign: 'center',
                }}>
                  {item.x}
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: chartTheme.axis.style.axisLabel.fill,
                  textAlign: 'center',
                }}>
                  {item.y}g
                </Text>
                {showTargets && (
                  <Text style={{
                    fontSize: 10,
                    color: item.percentage >= 90 && item.percentage <= 110 
                      ? chartColors.macros.protein 
                      : chartTheme.axis.style.tickLabels.fill,
                    textAlign: 'center',
                  }}>
                    {item.percentage}% of {item.target}g
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ChartContainer>
  );
};