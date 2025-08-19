import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Pie } from 'victory-native';
import { format, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface MacroChartProps {
  date?: Date;
  showTargets?: boolean;
  height?: number;
}

export const MacroChart: React.FC<MacroChartProps> = ({
  date = new Date(),
  showTargets = true,
  height = 350,
}) => {
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { foodLogs } = useFoodLogs();

  // Calculate macro data for the selected date
  const macroData = useMemo(() => {
    const today = format(startOfDay(date), 'yyyy-MM-dd');
    
    // Filter food logs for the selected date
    const dayLogs = foodLogs?.filter(log => {
      if (!log.created_at) return false;
      const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
      return logDate === today;
    }) || [];

    // Calculate total macros for the day
    const totals = dayLogs.reduce((acc, log) => {
      acc.protein += log.protein_consumed || 0;
      acc.carbs += log.carbs_consumed || 0;
      acc.fat += log.fat_consumed || 0;
      acc.calories += log.calories_consumed || 0;
      return acc;
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

    return {
      actual: {
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        calories: Math.round(totals.calories),
      },
    };
  }, [foodLogs, date]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    const { actual } = macroData;
    const total = (actual.protein * 4) + (actual.carbs * 4) + (actual.fat * 9);
    
    if (total === 0) return [];
    
    return [
      {
        label: 'Protein',
        value: actual.protein * 4,
        grams: actual.protein,
        percentage: Math.round((actual.protein * 4) / total * 100),
        color: chartColors.macros.protein,
      },
      {
        label: 'Carbs',
        value: actual.carbs * 4,
        grams: actual.carbs,
        percentage: Math.round((actual.carbs * 4) / total * 100),
        color: chartColors.macros.carbs,
      },
      {
        label: 'Fat',
        value: actual.fat * 9,
        grams: actual.fat,
        percentage: Math.round((actual.fat * 9) / total * 100),
        color: chartColors.macros.fat,
      },
    ].filter(item => item.value > 0);
  }, [macroData, chartColors]);

  const isEmpty = macroData.actual.protein === 0 && 
                  macroData.actual.carbs === 0 && 
                  macroData.actual.fat === 0;

  if (isEmpty) {
    return (
      <ChartContainer
        title="Macro Distribution"
        subtitle={format(date, 'MMMM dd, yyyy')}
        height={height}
      >
        <ChartEmptyState message="No macro data available for this date" />
      </ChartContainer>
    );
  }

  const styles = StyleSheet.create({
    chartWrapper: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    centerLabel: {
      position: 'absolute',
      alignItems: 'center',
    },
    centerValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    centerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  const chartWidth = Math.min(screenWidth - 64, 300);

  return (
    <ChartContainer
      title="Macro Distribution"
      subtitle={format(date, 'MMMM dd, yyyy')}
      height={height}
      noPadding={false}
    >
      <View style={styles.chartWrapper}>
        <Pie
          data={pieData}
          radius={({ chartBounds }) => Math.min(chartBounds.width, chartBounds.height) / 2 - 20}
          innerRadius={60}
          colorKey="color"
          labelKey="label"
          valueKey="value"
        />
        
        {/* Center label */}
        <View style={[styles.centerLabel, { top: height / 2 - 20 }]}>
          <Text style={styles.centerValue}>
            {chartFormatters.calories(macroData.actual.calories)}
          </Text>
          <Text style={styles.centerText}>Total</Text>
        </View>
      </View>

      {/* Legend */}
      <ChartLegend
        data={pieData.map(d => ({
          label: d.label,
          color: d.color,
          value: `${d.grams}g (${d.percentage}%)`,
        }))}
        horizontal={true}
      />
    </ChartContainer>
  );
};