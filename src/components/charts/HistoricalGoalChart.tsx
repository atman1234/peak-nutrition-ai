import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, ScrollView } from 'react-native';
import {
  VictoryArea,
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartTheme, useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useProfile } from '@/hooks/useProfile';

const { width: screenWidth } = Dimensions.get('window');

interface HistoricalGoalChartProps {
  days?: number;
  goalType?: 'calories' | 'weight' | 'protein';
  height?: number;
}

const periodOptions = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

const goalOptions = [
  { label: 'Calories', value: 'calories' },
  { label: 'Weight', value: 'weight' },
  { label: 'Protein', value: 'protein' },
];

export const HistoricalGoalChart: React.FC<HistoricalGoalChartProps> = ({
  days = 30,
  goalType = 'calories',
  height = 350,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(days.toString());
  const [selectedGoal, setSelectedGoal] = useState(goalType);
  
  const chartTheme = useChartTheme();
  const chartColors = useChartColors();
  const { profile } = useProfile();
  const { foodLogs, loading: foodLoading, error: foodError } = useFoodLogs();
  const { weightEntries, loading: weightLoading, error: weightError } = useWeightEntries();

  const loading = foodLoading || (selectedGoal === 'weight' && weightLoading);
  const error = foodError || (selectedGoal === 'weight' && weightError);

  // Get goal targets
  const goalTarget = useMemo(() => {
    switch (selectedGoal) {
      case 'calories':
        return profile?.target_calories || 2000;
      case 'weight':
        return profile?.target_weight || 0;
      case 'protein':
        const totalCalories = profile?.target_calories || 2000;
        const proteinPercent = profile?.target_protein_percent || 25;
        return Math.round((totalCalories * proteinPercent / 100) / 4); // grams
      default:
        return 0;
    }
  }, [profile, selectedGoal]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const today = startOfDay(new Date());
    const data = [];

    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      let actualValue = 0;
      let achievementPercentage = 0;

      if (selectedGoal === 'calories' || selectedGoal === 'protein') {
        // Calculate from food logs
        const dayLogs = foodLogs?.filter(log => {
          const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
          return logDate === dateStr;
        }) || [];

        if (selectedGoal === 'calories') {
          actualValue = dayLogs.reduce((sum, log) => {
            return sum + (log.food_item?.calories || 0) * (log.quantity || 0);
          }, 0);
        } else { // protein
          actualValue = dayLogs.reduce((sum, log) => {
            return sum + (log.food_item?.protein || 0) * (log.quantity || 0);
          }, 0);
        }
      } else if (selectedGoal === 'weight') {
        // Get weight entry for this date or closest previous date
        const sortedEntries = [...(weightEntries || [])].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        const entry = sortedEntries.find(e => {
          const entryDate = new Date(e.date);
          return entryDate <= date;
        });
        
        if (entry) {
          actualValue = entry.weight;
          // For weight, we calculate how close we are to the target
          if (goalTarget > 0) {
            const difference = Math.abs(actualValue - goalTarget);
            const maxDifference = goalTarget * 0.1; // 10% tolerance
            achievementPercentage = Math.max(0, Math.min(100, (1 - difference / maxDifference) * 100));
          }
        }
      }

      // Calculate achievement percentage for calories and protein
      if (selectedGoal !== 'weight' && goalTarget > 0) {
        achievementPercentage = Math.min(100, (actualValue / goalTarget) * 100);
      }

      data.push({
        x: format(date, 'MMM dd'),
        y: Math.round(actualValue),
        achievement: Math.round(achievementPercentage),
        date: date,
        target: goalTarget,
        label: selectedGoal === 'weight' 
          ? chartFormatters.weight(actualValue, profile?.preferred_units === 'imperial' ? 'lbs' : 'kg')
          : selectedGoal === 'calories'
          ? chartFormatters.calories(actualValue)
          : chartFormatters.macros(actualValue),
      });
    }

    return data;
  }, [foodLogs, weightEntries, selectedPeriod, selectedGoal, goalTarget, profile]);

  // Calculate success metrics
  const successMetrics = useMemo(() => {
    const validDays = chartData.filter(d => d.y > 0);
    if (validDays.length === 0) return { daysOnTarget: 0, averageAchievement: 0, streak: 0 };

    const targetThreshold = selectedGoal === 'weight' ? 90 : 80; // 90% for weight, 80% for calories/protein
    const daysOnTarget = validDays.filter(d => d.achievement >= targetThreshold).length;
    const averageAchievement = validDays.reduce((sum, d) => sum + d.achievement, 0) / validDays.length;
    
    // Calculate current streak
    let streak = 0;
    for (let i = validDays.length - 1; i >= 0; i--) {
      if (validDays[i].achievement >= targetThreshold) {
        streak++;
      } else {
        break;
      }
    }

    return {
      daysOnTarget,
      averageAchievement: Math.round(averageAchievement),
      streak,
    };
  }, [chartData, selectedGoal]);

  // Calculate min/max for Y axis
  const { minY, maxY } = useMemo(() => {
    const values = chartData.map(d => d.y).filter(v => v > 0);
    if (values.length === 0) return { minY: 0, maxY: 100 };

    const allValues = [...values, goalTarget];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 10;

    return {
      minY: Math.max(0, Math.floor(min - padding)),
      maxY: Math.ceil(max + padding),
    };
  }, [chartData, goalTarget]);

  // Get achievement area data (0-100%)
  const achievementData = chartData.map(d => ({
    x: d.x,
    y: d.achievement,
    y0: 0,
    date: d.date,
    label: `${d.achievement}% of goal`,
  }));

  if (loading) {
    return (
      <ChartContainer
        title="Goal Achievement"
        subtitle={`${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} progress tracking`}
        loading={true}
        height={height}
      />
    );
  }

  if (error) {
    return (
      <ChartContainer
        title="Goal Achievement"
        subtitle={`${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} progress tracking`}
        error="Failed to load goal tracking data"
        height={height}
      />
    );
  }

  const isEmpty = chartData.every(d => d.y === 0);

  if (isEmpty) {
    return (
      <ChartContainer
        title="Goal Achievement"
        subtitle={`${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} progress tracking`}
        height={height}
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ChartPeriodSelector
              periods={periodOptions}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedGoal(option.value as 'calories' | 'weight' | 'protein')}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: selectedGoal === option.value ? chartColors.success : 'transparent',
                  }}
                >
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '500',
                    color: selectedGoal === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      >
        <ChartEmptyState message={`No ${selectedGoal} data available for goal tracking`} />
      </ChartContainer>
    );
  }

  const chartWidth = Math.max(screenWidth - 32, 350);

  return (
    <ChartContainer
      title="Goal Achievement"
      subtitle={`${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} progress tracking`}
      height={height}
      noPadding={true}
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <View style={{ flexDirection: 'row', backgroundColor: chartTheme.axis.style.axis.stroke, borderRadius: 8, padding: 2 }}>
            {goalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedGoal(option.value as 'calories' | 'weight' | 'protein')}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedGoal === option.value ? chartColors.success : 'transparent',
                }}
              >
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '500',
                  color: selectedGoal === option.value ? '#FFFFFF' : chartTheme.axis.style.tickLabels.fill,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16 }}>
          {/* Achievement Progress Chart */}
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={height - 140}
            padding={{ left: 70, bottom: 60, right: 40, top: 20 }}
            domain={{ y: [0, 100] }}
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
                  angle: chartData.length > 14 ? -45 : 0,
                  textAnchor: chartData.length > 14 ? 'end' : 'middle',
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
              tickFormat={(t) => `${t}%`}
              label="Goal Achievement (%)"
              axisLabelComponent={
                <VictoryLabel
                  dy={-30}
                  style={chartTheme.axis.style.axisLabel}
                />
              }
            />
            
            {/* Target line at 100% */}
            <VictoryLine
              data={[
                { x: achievementData[0]?.x, y: 100 },
                { x: achievementData[achievementData.length - 1]?.x, y: 100 },
              ]}
              style={{
                data: {
                  stroke: chartColors.success,
                  strokeWidth: 2,
                  strokeDasharray: '5,5',
                },
              }}
            />
            
            {/* Achievement threshold line */}
            <VictoryLine
              data={[
                { x: achievementData[0]?.x, y: selectedGoal === 'weight' ? 90 : 80 },
                { x: achievementData[achievementData.length - 1]?.x, y: selectedGoal === 'weight' ? 90 : 80 },
              ]}
              style={{
                data: {
                  stroke: chartColors.warning,
                  strokeWidth: 1,
                  strokeDasharray: '3,3',
                  opacity: 0.7,
                },
              }}
            />
            
            {/* Achievement area */}
            <VictoryArea
              data={achievementData}
              style={{
                data: {
                  fill: chartColors.success,
                  fillOpacity: 0.3,
                  stroke: chartColors.success,
                  strokeWidth: 2,
                },
              }}
              interpolation="monotoneX"
              animate={{
                duration: 800,
                onLoad: { duration: 500 },
              }}
            />
            
            {/* Achievement points */}
            <VictoryScatter
              data={achievementData}
              size={({ datum }) => datum.y >= (selectedGoal === 'weight' ? 90 : 80) ? 5 : 3}
              style={{
                data: {
                  fill: ({ datum }) => datum.y >= (selectedGoal === 'weight' ? 90 : 80) 
                    ? chartColors.success 
                    : chartColors.warning,
                  stroke: chartTheme.axis.style.axis.stroke,
                  strokeWidth: 1,
                },
              }}
            />
          </VictoryChart>
        </View>
      </ScrollView>
      
      {/* Success Metrics */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: chartTheme.axis.style.axis.stroke,
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Days on Target
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartColors.success }}>
            {successMetrics.daysOnTarget}
          </Text>
          <Text style={{ fontSize: 10, color: chartTheme.axis.style.tickLabels.fill }}>
            out of {chartData.filter(d => d.y > 0).length}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Average
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {successMetrics.averageAchievement}%
          </Text>
          <Text style={{ fontSize: 10, color: chartTheme.axis.style.tickLabels.fill }}>
            achievement
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Current Streak
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartColors.primary }}>
            {successMetrics.streak}
          </Text>
          <Text style={{ fontSize: 10, color: chartTheme.axis.style.tickLabels.fill }}>
            days
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: chartTheme.axis.style.tickLabels.fill }}>
            Target
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: chartTheme.axis.style.axisLabel.fill }}>
            {selectedGoal === 'weight' 
              ? chartFormatters.weight(goalTarget, profile?.preferred_units === 'imperial' ? 'lbs' : 'kg')
              : selectedGoal === 'calories'
              ? chartFormatters.calories(goalTarget)
              : chartFormatters.macros(goalTarget)}
          </Text>
        </View>
      </View>
    </ChartContainer>
  );
};