import React, { useMemo, useState } from 'react';
import { View, Dimensions, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { PolarChart, Pie, Bar, CartesianChart } from 'victory-native';
import { format, startOfDay } from 'date-fns';
import { useChartColors, chartFormatters } from './common/ChartTheme';
import { ChartContainer, ChartLegend, ChartEmptyState } from './common/ChartContainer';
import { useFoodLogs } from '@/hooks/useFoodLogs';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type ChartMode = 'pie' | 'bar' | 'table';

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
  const [chartMode, setChartMode] = useState<ChartMode>('pie');
  const chartColors = useChartColors();
  const { colors } = useTheme();
  const { profile } = useProfile();
  
  // Get the date string for food logs
  const dateString = format(date, 'yyyy-MM-dd');
  
  // Use food logs directly like the original app
  const { dailySummary, isLoading } = useFoodLogs(dateString);

  // Calculate macro data with targets for the selected date
  const macroData = useMemo(() => {
    if (isLoading || !dailySummary) {
      return {
        actual: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        targets: { protein: 0, carbs: 0, fat: 0 },
        percentages: { protein: 0, carbs: 0, fat: 0 },
      };
    }

    const actual = {
      protein: Math.round(dailySummary.totalProtein),
      carbs: Math.round(dailySummary.totalCarbs),
      fat: Math.round(dailySummary.totalFat),
      calories: Math.round(dailySummary.totalCalories),
    };

    const targets = {
      protein: profile?.protein_target_g || Math.round(((profile?.daily_calorie_target || 2000) * 0.25) / 4),
      carbs: profile?.carb_target_g || Math.round(((profile?.daily_calorie_target || 2000) * 0.50) / 4),
      fat: profile?.fat_target_g || Math.round(((profile?.daily_calorie_target || 2000) * 0.25) / 9),
    };

    const percentages = {
      protein: targets.protein > 0 ? Math.round((actual.protein / targets.protein) * 100) : 0,
      carbs: targets.carbs > 0 ? Math.round((actual.carbs / targets.carbs) * 100) : 0,
      fat: targets.fat > 0 ? Math.round((actual.fat / targets.fat) * 100) : 0,
    };

    return { actual, targets, percentages };
  }, [dailySummary, isLoading, profile]);

  // Prepare chart data for both pie and bar charts
  const { pieData, barData } = useMemo(() => {
    const { actual, targets, percentages } = macroData;
    const total = (actual.protein * 4) + (actual.carbs * 4) + (actual.fat * 9);
    
    const pieData = total === 0 ? [] : [
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

    const barData = [
      {
        macro: 'Protein',
        actual: actual.protein,
        target: targets.protein,
        percentage: percentages.protein,
        color: chartColors.macros.protein,
      },
      {
        macro: 'Carbs', 
        actual: actual.carbs,
        target: targets.carbs,
        percentage: percentages.carbs,
        color: chartColors.macros.carbs,
      },
      {
        macro: 'Fat',
        actual: actual.fat,
        target: targets.fat,
        percentage: percentages.fat,
        color: chartColors.macros.fat,
      },
    ];

    return { pieData, barData };
  }, [macroData, chartColors]);

  const isEmpty = macroData.actual.protein === 0 && 
                  macroData.actual.carbs === 0 && 
                  macroData.actual.fat === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="chart-donut" 
              size={20} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <View>
              <Text style={styles.title}>Macro Distribution</Text>
              <Text style={styles.subtitle}>{format(date, 'MMMM dd, yyyy')}</Text>
            </View>
          </View>
        </View>
        <ChartEmptyState message="No macro data available for this date" />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    targetSummary: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    targetText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    controlsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    controlLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chartTypeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartTypeButton: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    chartTypeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chartTypeButtonTextActive: {
      color: colors.card,
    },
    chartWrapper: {
      alignItems: 'center',
      paddingVertical: 20,
      height: 280,
    },
    pieChartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      height: 280,
      width: '100%',
    },
    pieChartContainer: {
      flex: 1,
      padding: 16,
    },
    pieChartTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    pieChartGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 120,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    pieChartItem: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
      maxWidth: 60,
    },
    pieChartBarContainer: {
      height: 80,
      width: 24,
      backgroundColor: colors.background,
      borderRadius: 12,
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    pieChartBar: {
      width: '100%',
      borderRadius: 12,
      minHeight: 8,
    },
    pieChartLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
      textAlign: 'center',
      fontWeight: '500',
    },
    pieChartValue: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 1,
    },
    pieChartPercentage: {
      fontSize: 9,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    totalDisplay: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    totalText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
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
    barChartContainer: {
      paddingHorizontal: 20,
      paddingVertical: 30,
      height: 280,
      width: screenWidth - 40,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    barItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    barLabel: {
      width: 60,
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 0,
    },
    barContainer: {
      flex: 1,
      height: 24,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginHorizontal: 8,
      overflow: 'hidden',
      minWidth: 100,
    },
    barFill: {
      height: '100%',
      borderRadius: 12,
    },
    barValue: {
      width: 70,
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
      flexShrink: 0,
    },
    // Table Mode Styles
    tableContainer: {
      paddingHorizontal: 8,
      paddingVertical: 16,
      backgroundColor: colors.card,
      minHeight: 200,
      borderRadius: 12,
      marginHorizontal: 4,
      width: screenWidth - 16,
      alignSelf: 'center',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 18,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      marginBottom: 12,
      backgroundColor: colors.primary + '08',
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    tableHeaderCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableHeaderText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      backgroundColor: colors.background + '15',
      marginVertical: 6,
      minHeight: 80,
      borderRadius: 12,
    },
    tableMacroCell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 8,
    },
    tableDataCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    tableDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    tableCellText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    tableValueText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    tablePercentageText: {
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    // Pie Chart Styles
    pieChartArea: {
      height: 220,
      width: 220,
      alignSelf: 'center',
      position: 'relative',
      marginBottom: 20,
    },
    pieCenter: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -35,
      marginLeft: -45,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      backgroundColor: colors.card,
      borderRadius: 40,
      width: 90,
      height: 70,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    pieCenterValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    pieCenterLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 2,
    },
    pieLegend: {
      marginTop: 15,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    pieLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingVertical: 4,
    },
    pieLegendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    pieLegendLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    pieLegendValue: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    analyticsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 12,
    },
    analyticsCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.background + '60',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    analyticsValue: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
      color: colors.text,
    },
    analyticsLabel: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    analyticsSubtext: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
  });

  const chartWidth = Math.min(screenWidth - 64, 280);

  return (
    <View style={styles.container}>
      {/* Header - Title Only */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="chart-donut" 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <View>
            <Text style={styles.title}>Macro Distribution</Text>
          </View>
        </View>
      </View>

      {/* Target Summary */}
      <View style={styles.targetSummary}>
        <Text style={styles.targetText}>{format(date, 'MMMM dd, yyyy')} • Total: {macroData.actual.calories} cal</Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Chart Type</Text>
        <View style={styles.chartTypeSelector}>
          {(['pie', 'bar', 'table'] as ChartMode[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chartTypeButton,
                chartMode === type && styles.chartTypeButtonActive
              ]}
              onPress={() => setChartMode(type)}
            >
              <Text style={[
                styles.chartTypeButtonText,
                chartMode === type && styles.chartTypeButtonTextActive
              ]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.chartWrapper, { width: screenWidth - 8, minHeight: chartMode === 'pie' ? 420 : chartMode === 'table' ? 380 : 280 }]}>
        {chartMode === 'table' ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <Text style={[styles.tableHeaderText, { textAlign: 'left' }]}>Macro</Text>
              </View>
              <View style={{ flex: 1.3 }}>
                <Text style={styles.tableHeaderText}>Actual</Text>
              </View>
              <View style={{ flex: 1.3 }}>
                <Text style={styles.tableHeaderText}>Target</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tableHeaderText}>%</Text>
              </View>
            </View>
            
            {barData && barData.length > 0 ? (
              <>
                {barData.map((item, index) => {
                  console.log('Table row data:', item);
                  return (
                    <View key={`${item.macro}-${index}`} style={styles.tableRow}>
                      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}>
                        <View style={[styles.tableDot, { backgroundColor: item.color }]} />
                        <Text style={styles.tableCellText}>{item.macro}</Text>
                      </View>
                      <View style={{ flex: 1.3, alignItems: 'center' }}>
                        <Text style={styles.tableValueText}>{item.actual}g</Text>
                      </View>
                      <View style={{ flex: 1.3, alignItems: 'center' }}>
                        <Text style={styles.tableValueText}>{item.target}g</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[
                          styles.tablePercentageText,
                          { color: item.percentage >= 100 ? '#10B981' : item.percentage >= 80 ? '#F59E0B' : '#EF4444' }
                        ]}>
                          {item.percentage}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  No macro data available (barData: {JSON.stringify(barData)})
                </Text>
              </View>
            )}
          </View>
        ) : chartMode === 'bar' ? (
          <View style={styles.barChartContainer}>
            {barData.map((item, index) => (
              <View key={index} style={styles.barItem}>
                <Text style={styles.barLabel} numberOfLines={1}>{item.macro}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${Math.min(100, (item.actual / Math.max(item.target, item.actual)) * 100)}%`,
                        backgroundColor: item.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barValue} numberOfLines={1}>{item.actual}g</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.pieChartWrapper}>
            {pieData.length > 0 ? (
              <View style={styles.pieChartContainer}>
                {/* Actual PIE Chart using PolarChart */}
                <View style={styles.pieChartArea}>
                  <PolarChart
                    data={pieData}
                    labelKey="label"
                    valueKey="value"
                    colorKey="color"
                  >
                    <Pie.Chart innerRadius={50} outerRadius={95}>
                      {({ slice }) => (
                        <Pie.Slice 
                          slice={slice}
                          animate={{ type: "timing", duration: 300 }}
                        />
                      )}
                    </Pie.Chart>
                  </PolarChart>
                  
                  {/* Center label overlay */}
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterValue}>
                      {chartFormatters.calories(macroData.actual.calories)}
                    </Text>
                    <Text style={styles.pieCenterLabel}>Total Calories</Text>
                  </View>
                </View>
                
                {/* Legend below pie chart */}
                <View style={styles.pieLegend}>
                  {pieData.map((item, index) => (
                    <View key={index} style={styles.pieLegendItem}>
                      <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLegendLabel}>{item.label}</Text>
                      <Text style={styles.pieLegendValue}>{item.grams}g • {item.percentage}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  No macro data available
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Analytics Grid */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {macroData.percentages.protein}%
          </Text>
          <Text style={styles.analyticsLabel}>Protein Target</Text>
          <Text style={styles.analyticsSubtext}>{macroData.actual.protein}g / {macroData.targets.protein}g</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {macroData.percentages.carbs}%
          </Text>
          <Text style={styles.analyticsLabel}>Carbs Target</Text>
          <Text style={styles.analyticsSubtext}>{macroData.actual.carbs}g / {macroData.targets.carbs}g</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {macroData.percentages.fat}%
          </Text>
          <Text style={styles.analyticsLabel}>Fat Target</Text>
          <Text style={styles.analyticsSubtext}>{macroData.actual.fat}g / {macroData.targets.fat}g</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons 
              name="target" 
              size={16} 
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.analyticsValue, { fontSize: 16, marginBottom: 0 }]}>
              {Math.round((macroData.percentages.protein + macroData.percentages.carbs + macroData.percentages.fat) / 3)}%
            </Text>
          </View>
          <Text style={styles.analyticsLabel}>Overall Balance</Text>
        </View>
      </View>
    </View>
  );
};