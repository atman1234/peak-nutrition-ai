import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { useTheme, TextStyles, Spacing } from '../../constants';

interface FoodSearchItemProps {
  food: UnifiedFoodResult;
  onPress: () => void;
}

export function FoodSearchItem({ food, onPress }: FoodSearchItemProps) {
  const { colors } = useTheme();

  // Create dynamic styles based on theme
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    favoriteContainer: {
      backgroundColor: `${colors.crimson}08`, // Very light red tint
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    name: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
      marginRight: Spacing.sm,
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    favoriteIcon: {
      marginRight: Spacing.xs,
    },
    brand: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      fontStyle: 'italic',
    },
    nutrition: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      flexWrap: 'wrap',
    },
    nutritionText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    nutritionDivider: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginHorizontal: Spacing.xs,
      fontSize: 12,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sourceLabel: {
      ...TextStyles.caption,
      color: colors.sage,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    confidence: {
      ...TextStyles.caption,
      color: colors.gold,
      fontSize: 11,
      fontWeight: '600',
    },
    chevron: {
      marginLeft: Spacing.sm,
    },
  }), [colors]);
  const getSourceIcon = () => {
    switch (food.source) {
      case 'usda':
        return 'library-outline';
      case 'verified':
        return 'checkmark-circle-outline';
      case 'ai_estimate':
        return 'bulb-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getSourceColor = () => {
    switch (food.source) {
      case 'usda':
        return colors.sage;
      case 'verified':
        return colors.gold;
      case 'ai_estimate':
        return colors.crimson;
      default:
        return colors.textSecondary;
    }
  };

  const getResultTypeLabel = () => {
    switch (food.resultType) {
      case 'favorite':
        return 'Favorite';
      case 'saved':
        return 'Previously Used';
      case 'usda_foundation':
        return 'USDA Foundation';
      case 'usda_branded':
        return 'USDA Branded';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        food.isFavorite && styles.favoriteContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {food.name}
          </Text>
          
          <View style={styles.badges}>
            {food.isFavorite && (
              <Ionicons 
                name="heart" 
                size={16} 
                color={colors.crimson} 
                style={styles.favoriteIcon}
              />
            )}
            
            <Ionicons
              name={getSourceIcon()}
              size={16}
              color={getSourceColor()}
            />
          </View>
        </View>

        {food.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {food.brand}
          </Text>
        )}

        <View style={styles.nutrition}>
          <Text style={styles.nutritionText}>
            {Math.round(food.calories_per_100g)}cal
          </Text>
          <Text style={styles.nutritionDivider}>•</Text>
          <Text style={styles.nutritionText}>
            {Math.round(food.protein_per_100g)}g protein
          </Text>
          <Text style={styles.nutritionDivider}>•</Text>
          <Text style={styles.nutritionText}>
            {Math.round(food.carbs_per_100g)}g carbs
          </Text>
          <Text style={styles.nutritionDivider}>•</Text>
          <Text style={styles.nutritionText}>
            {Math.round(food.fat_per_100g)}g fat
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.sourceLabel}>
            {getResultTypeLabel()}
          </Text>
          
          {food.confidence_score && (
            <Text style={styles.confidence}>
              {Math.round(food.confidence_score * 100)}% match
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

