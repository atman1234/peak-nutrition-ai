import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useAIDailyReview } from '@/hooks/useAIDailyReview';
import { format, subDays } from 'date-fns';
import { ChartPeriodSelector } from '../charts/common/ChartContainer';
import { getTodayLocalDate, formatDateWithDay } from '../../lib/date-utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AIReviewTabProps {
  initialDate?: string;
}

const periodOptions = [
  { label: 'Today', value: '0' },
  { label: 'Yesterday', value: '1' },
  { label: '2 days ago', value: '2' },
  { label: '3 days ago', value: '3' },
  { label: '7 days ago', value: '7' },
];

export const AIReviewTab: React.FC<AIReviewTabProps> = () => {
  const { colors } = useTheme();
  const [selectedDaysAgo, setSelectedDaysAgo] = useState('0');
  const [userGuidance, setUserGuidance] = useState('');
  const [showGuidanceInput, setShowGuidanceInput] = useState(false);
  
  // Calculate the date based on selected days ago (using local timezone)
  const targetDate = selectedDaysAgo === '0' 
    ? getTodayLocalDate()
    : subDays(new Date(), parseInt(selectedDaysAgo)).toISOString().split('T')[0];
  
  const {
    dailyReview,
    isLoadingReview,
    isGenerating,
    isRefreshing,
    generateReview,
    refreshReview,
    hasReview,
    canGenerate,
    canRefresh,
    refreshesRemaining,
    generateError,
    refreshError,
  } = useAIDailyReview(targetDate);

  const handleGenerateReview = () => {
    generateReview({ userGuidance: userGuidance || undefined });
    setUserGuidance('');
    setShowGuidanceInput(false);
  };

  const handleRefreshReview = () => {
    refreshReview({ userGuidance: userGuidance || undefined });
    setUserGuidance('');
    setShowGuidanceInput(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 20,
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 80,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
      maxWidth: 300,
    },
    generateButton: {
      backgroundColor: '#8B5CF6',  // Purple color that works in both themes
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshButton: {
      backgroundColor: colors.secondary || colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 12,
      shadowColor: colors.secondary || colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginLeft: 8,
    },
    reviewContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      backgroundColor: colors.background,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    analysisCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    nutritionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    nutritionCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    nutritionCardCalories: {
      backgroundColor: colors.background + '80',
    },
    nutritionCardProtein: {
      backgroundColor: '#3B82F6' + '15',
    },
    nutritionCardCarbs: {
      backgroundColor: '#10B981' + '15',
    },
    nutritionCardFat: {
      backgroundColor: '#F59E0B' + '15',
    },
    nutritionValue: {
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 4,
    },
    nutritionValueCalories: {
      color: colors.text,
    },
    nutritionValueProtein: {
      color: '#3B82F6',
    },
    nutritionValueCarbs: {
      color: '#10B981',
    },
    nutritionValueFat: {
      color: '#F59E0B',
    },
    nutritionLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    nutritionLabelCalories: {
      color: colors.textSecondary,
    },
    nutritionLabelProtein: {
      color: '#3B82F6' + 'CC',
    },
    nutritionLabelCarbs: {
      color: '#10B981' + 'CC',
    },
    nutritionLabelFat: {
      color: '#F59E0B' + 'CC',
    },
    nutritionGoal: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    analysisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    analysisLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    analysisValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    achievementsGrid: {
      gap: 16,
    },
    achievementCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    achievementCardSuccess: {
      borderLeftWidth: 4,
      borderLeftColor: '#10B981',
      backgroundColor: '#10B981' + '08',
    },
    achievementCardImprovement: {
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
      backgroundColor: '#3B82F6' + '08',
    },
    achievementCardFocus: {
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      backgroundColor: '#F59E0B' + '08',
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    achievementText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      fontWeight: '500',
      marginLeft: 12,
    },
    adviceCard: {
      backgroundColor: '#8B5CF6' + '08',
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#8B5CF6',
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 20,
    },
    adviceText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      fontWeight: '500',
    },
    errorCard: {
      backgroundColor: colors.error + '08',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.error + '30',
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      flex: 1,
      marginLeft: 8,
      fontWeight: '500',
    },
    guidanceContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border + '30',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    guidanceInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border + '40',
      minHeight: 100,
      textAlignVertical: 'top',
      fontWeight: '400',
    },
    guidanceLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
      flexDirection: 'row',
      alignItems: 'center',
    },
    refreshInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '20',
    },
    refreshInfoText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    proIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B' + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
    },
    proText: {
      fontSize: 12,
      color: '#F59E0B',
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  // Loading state
  if (isLoadingReview && !dailyReview) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
              <Text style={styles.title}>AI Daily Review</Text>
            </View>
            <ChartPeriodSelector
              periods={periodOptions}
              selectedPeriod={selectedDaysAgo}
              onPeriodChange={setSelectedDaysAgo}
            />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons 
            name="brain" 
            size={48} 
            color={colors.primary} 
            style={{ opacity: 0.6 }} 
          />
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Loading your daily review...</Text>
        </View>
      </View>
    );
  }

  // Generating/Refreshing state
  if (isGenerating || isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
              <Text style={styles.title}>AI Daily Review</Text>
            </View>
            <ChartPeriodSelector
              periods={periodOptions}
              selectedPeriod={selectedDaysAgo}
              onPeriodChange={setSelectedDaysAgo}
            />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons 
            name="brain" 
            size={48} 
            color={colors.primary} 
            style={{ opacity: 0.6 }} 
          />
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>
            {isGenerating ? 'Generating your personalized review...' : 'Refreshing your review...'}
          </Text>
          <Text style={[styles.loadingText, { fontSize: 13, marginTop: 8, opacity: 0.8 }]}>
            This may take a few moments
          </Text>
        </View>
      </View>
    );
  }

  // No review state
  if (!hasReview && !isLoadingReview) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
              <Text style={styles.title}>AI Daily Review</Text>
            </View>
            <ChartPeriodSelector
              periods={periodOptions}
              selectedPeriod={selectedDaysAgo}
              onPeriodChange={setSelectedDaysAgo}
            />
          </View>
          <Text style={styles.subtitle}>
            {formatDateWithDay(targetDate)}
          </Text>
        </View>

        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="brain" 
            size={64} 
            color={colors.textSecondary} 
            style={{ opacity: 0.4 }} 
          />
          <Text style={styles.emptyText}>Generate Daily Review</Text>
          <Text style={styles.emptySubtext}>
            {canGenerate 
              ? `Get AI-powered insights about your nutrition for ${selectedDaysAgo === '0' ? 'today' : format(new Date(targetDate), 'MMM d')}, including achievements, improvements, and personalized advice.`
              : 'AI features require a Pro subscription.'}
          </Text>
          
          {(generateError || refreshError) && (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>
                {generateError?.message || refreshError?.message}
              </Text>
            </View>
          )}

          {showGuidanceInput && (
            <View style={styles.guidanceContainer}>
              <View style={[styles.guidanceLabel, { flexDirection: 'row', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.guidanceLabel, { marginLeft: 4 }]}>
                  Any specific areas you'd like the AI to focus on? (optional)
                </Text>
              </View>
              <TextInput
                style={styles.guidanceInput}
                placeholder="E.g., focus on protein intake, meal timing, etc."
                placeholderTextColor={colors.textSecondary + '80'}
                value={userGuidance}
                onChangeText={setUserGuidance}
                multiline
              />
            </View>
          )}

          {canGenerate && (
            <>
              {!showGuidanceInput ? (
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={() => setShowGuidanceInput(true)}
                >
                  <MaterialCommunityIcons name="brain" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Generate Review</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={handleGenerateReview}
                >
                  <MaterialCommunityIcons name="brain" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Generate with Guidance</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  // Display review
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={canRefresh ? handleRefreshReview : undefined}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
            <Text style={styles.title}>AI Daily Review</Text>
            <View style={styles.proIndicator}>
              <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <ChartPeriodSelector
            periods={periodOptions}
            selectedPeriod={selectedDaysAgo}
            onPeriodChange={setSelectedDaysAgo}
          />
        </View>
        <Text style={styles.subtitle}>
          {formatDateWithDay(targetDate)}
        </Text>
      </View>

      <View style={styles.reviewContent}>
        {/* Nutrition Analysis */}
        {dailyReview?.analysis && (
          <View style={styles.section}>
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name="chart-box" 
                size={20} 
                color="#3B82F6" 
                style={styles.sectionIcon} 
              />
              <Text style={styles.sectionTitle}>Nutrition Summary</Text>
            </View>
            <View style={styles.analysisCard}>
              <View style={styles.nutritionGrid}>
                <View style={[styles.nutritionCard, styles.nutritionCardCalories]}>
                  <Text style={[styles.nutritionValue, styles.nutritionValueCalories]}>
                    {Math.round(dailyReview.analysis.total_calories)}
                  </Text>
                  <Text style={[styles.nutritionLabel, styles.nutritionLabelCalories]}>Calories</Text>
                  {dailyReview.analysis.goal_calories && (
                    <Text style={styles.nutritionGoal}>Goal: {dailyReview.analysis.goal_calories}</Text>
                  )}
                </View>
                <View style={[styles.nutritionCard, styles.nutritionCardProtein]}>
                  <Text style={[styles.nutritionValue, styles.nutritionValueProtein]}>
                    {Math.round(dailyReview.analysis.total_protein)}g
                  </Text>
                  <Text style={[styles.nutritionLabel, styles.nutritionLabelProtein]}>Protein</Text>
                  {dailyReview.analysis.goal_protein && (
                    <Text style={styles.nutritionGoal}>Goal: {dailyReview.analysis.goal_protein}g</Text>
                  )}
                </View>
                <View style={[styles.nutritionCard, styles.nutritionCardCarbs]}>
                  <Text style={[styles.nutritionValue, styles.nutritionValueCarbs]}>
                    {Math.round(dailyReview.analysis.total_carbs)}g
                  </Text>
                  <Text style={[styles.nutritionLabel, styles.nutritionLabelCarbs]}>Carbs</Text>
                  {dailyReview.analysis.goal_carbs && (
                    <Text style={styles.nutritionGoal}>Goal: {dailyReview.analysis.goal_carbs}g</Text>
                  )}
                </View>
                <View style={[styles.nutritionCard, styles.nutritionCardFat]}>
                  <Text style={[styles.nutritionValue, styles.nutritionValueFat]}>
                    {Math.round(dailyReview.analysis.total_fat)}g
                  </Text>
                  <Text style={[styles.nutritionLabel, styles.nutritionLabelFat]}>Fat</Text>
                  {dailyReview.analysis.goal_fat && (
                    <Text style={styles.nutritionGoal}>Goal: {dailyReview.analysis.goal_fat}g</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Achievements */}
        {dailyReview?.achievements && dailyReview.achievements.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name="trophy-award" 
                size={20} 
                color="#10B981" 
                style={styles.sectionIcon} 
              />
              <Text style={styles.sectionTitle}>Today's Achievements</Text>
            </View>
            <View style={[styles.achievementCard, styles.achievementCardSuccess]}>
              {dailyReview.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={18} 
                    color="#10B981" 
                  />
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Areas for Improvement */}
        {dailyReview?.improvements && dailyReview.improvements.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name="lightbulb-on" 
                size={20} 
                color="#3B82F6" 
                style={styles.sectionIcon} 
              />
              <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            </View>
            <View style={[styles.achievementCard, styles.achievementCardImprovement]}>
              {dailyReview.improvements.map((improvement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <MaterialCommunityIcons 
                    name="lightbulb-on" 
                    size={18} 
                    color="#3B82F6" 
                  />
                  <Text style={styles.achievementText}>{improvement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tomorrow's Focus */}
        {dailyReview?.tomorrow_focus && dailyReview.tomorrow_focus.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name="target" 
                size={20} 
                color="#F59E0B" 
                style={styles.sectionIcon} 
              />
              <Text style={styles.sectionTitle}>Tomorrow's Focus</Text>
            </View>
            <View style={[styles.achievementCard, styles.achievementCardFocus]}>
              {dailyReview.tomorrow_focus.map((focus, index) => (
                <View key={index} style={styles.achievementItem}>
                  <MaterialCommunityIcons 
                    name="target" 
                    size={18} 
                    color="#F59E0B" 
                  />
                  <Text style={styles.achievementText}>{focus}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personalized Advice */}
        {dailyReview?.personalized_advice && (
          <View style={styles.section}>
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialCommunityIcons 
                name="message-text" 
                size={20} 
                color="#8B5CF6" 
                style={styles.sectionIcon} 
              />
              <Text style={styles.sectionTitle}>Personalized Advice</Text>
            </View>
            <View style={styles.adviceCard}>
              <Text style={styles.adviceText}>{dailyReview.personalized_advice}</Text>
            </View>
          </View>
        )}

        {/* Refresh Options */}
        {canRefresh && (
          <View style={styles.section}>
            {showGuidanceInput && (
              <View style={styles.guidanceContainer}>
                <View style={[styles.guidanceLabel, { flexDirection: 'row', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.guidanceLabel, { marginLeft: 4 }]}>
                    Want to focus on something specific? (optional)
                  </Text>
                </View>
                <TextInput
                  style={styles.guidanceInput}
                  placeholder="E.g., focus on protein intake, meal timing, etc."
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={userGuidance}
                  onChangeText={setUserGuidance}
                  multiline
                />
              </View>
            )}
            
            {!showGuidanceInput ? (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => setShowGuidanceInput(true)}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Refresh Review</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefreshReview}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Refresh with Guidance</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.refreshInfo}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.refreshInfoText, { marginLeft: 4 }]}>
                {refreshesRemaining} refresh{refreshesRemaining !== 1 ? 'es' : ''} remaining today
              </Text>
            </View>
          </View>
        )}

        {/* Error Display */}
        {(generateError || refreshError) && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>
              {generateError?.message || refreshError?.message}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};