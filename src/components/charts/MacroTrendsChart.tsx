import React, { useMemo, useState } from 'react';
import { View, Dimensions, ScrollView, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartPeriodSelector, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useTheme } from '@/constants/theme';

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
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { foodLogs } = useFoodLogs();

  // Chart press state for interactions
  const { state, isActive } = useChartPressState({ 
    x: 0, 
    y: { protein: 0 } 
  });

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
        if (!log.created_at) return false;
        const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      }) || [];

      // Calculate total macros for the day
      const totals = dayLogs.reduce((acc, log) => {
        acc.protein += log.protein_consumed || 0;
        acc.carbs += log.carbs_consumed || 0;
        acc.fat += log.fat_consumed || 0;
        return acc;
      }, { protein: 0, carbs: 0, fat: 0 });

      data.push({
        day: format(date, 'MMM dd'),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        date: date,
      });
    }

    return data;
  }, [foodLogs, selectedPeriod]);

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

  const styles = StyleSheet.create({
    chartWrapper: {
      paddingHorizontal: 16,
    },
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      alignItems: 'center',
      marginHorizontal: 12,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    legendLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    legendValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    tooltipContainer: {
      position: 'absolute',
      backgroundColor: colors.card,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tooltipText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
  });

  // Calculate averages for legend
  const averages = useMemo(() => {
    if (trendData.length === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round(trendData.reduce((sum, d) => sum + d.protein, 0) / trendData.length),
      carbs: Math.round(trendData.reduce((sum, d) => sum + d.carbs, 0) / trendData.length),
      fat: Math.round(trendData.reduce((sum, d) => sum + d.fat, 0) / trendData.length),
    };
  }, [trendData]);

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
        <View style={styles.chartWrapper}>
          <CartesianChart
            data={trendData}
            xKey="day"
            yKeys={["protein"]}
            domainPadding={{ left: 50, right: 50, top: 20, bottom: 50 }}
            chartPressState={state}
          >
            {({ points, chartBounds }) => (
              <>
                {/* Protein Line - only showing protein for simplicity */}
                <Line
                  points={points.protein}
                  color={chartColors.macros.protein}
                  strokeWidth={2}
                />

                {/* Tooltip */}
                {isActive && (
                  <View
                    style={[
                      styles.tooltipContainer,
                      {
                        left: state.x.position - 40,
                        top: state.y.protein.position - 40,
                      },
                    ]}
                  >
                    <Text style={styles.tooltipText}>
                      {chartFormatters.macros(state.y.protein.value)} protein
                    </Text>
                  </View>
                )}
              </>
            )}
          </CartesianChart>
        </View>
      </ScrollView>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: chartColors.macros.protein }]} />
          <Text style={styles.legendLabel}>Protein</Text>
          <Text style={styles.legendValue}>{averages.protein}g</Text>
          <Text style={styles.legendLabel}>avg</Text>
        </View>
      </View>
    </ChartContainer>
  );
};