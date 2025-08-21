import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tables } from '../../types/supabase';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { useFavorites } from '../../hooks/useFavorites';

type FoodLog = Tables<'food_logs'>;

interface FoodLogEntryProps {
  food: FoodLog;
  onEdit?: () => void;
  onDelete?: () => void;
  isLast?: boolean;
  showExpandedByDefault?: boolean;
}

export function FoodLogEntry({ food, onEdit, onDelete, isLast = false, showExpandedByDefault = false }: FoodLogEntryProps) {
  const { colors } = useTheme();
  const { addFavorite, isFavorite, canAddMoreFavorites } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(showExpandedByDefault);
  
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Food Entry',
      `Are you sure you want to delete "${food.food_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.();
          },
        },
      ]
    );
  };

  const handleAddToFavorites = () => {
    if (!food.food_item_id) {
      Alert.alert('Error', 'Cannot add this food to favorites');
      return;
    }
    
    addFavorite({
      food_item_id: food.food_item_id,
      typical_portion_grams: food.portion_grams || 100,
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      position: 'relative',
      backgroundColor: colors.surface,
    },
    containerWithBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      minHeight: 72,
    },
    foodInfo: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    foodName: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    brandName: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: Spacing.xs,
    },
    portionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    portionText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    timeDivider: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginHorizontal: Spacing.xs,
    },
    timeText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    nutritionInfo: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    caloriesText: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '700',
      fontSize: 18,
    },
    caloriesLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    macrosRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    macroText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    actionButtonsInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    editButtonInline: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
      backgroundColor: `${colors.gold}20`,
    },
    deleteButtonInline: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
      backgroundColor: `${colors.crimson}20`,
    },
    expandedContent: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    notesSection: {
      marginBottom: Spacing.sm,
    },
    notesLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    notesText: {
      ...TextStyles.body,
      color: colors.text,
      fontStyle: 'italic',
    },
    detailedMacros: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Spacing.borderRadius.sm,
      marginBottom: Spacing.sm,
    },
    macroItem: {
      alignItems: 'center',
    },
    macroValue: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
    },
    macroLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 11,
    },
    expandButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    favoriteButton: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
      backgroundColor: `${colors.sage}20`,
    },
  }), [colors]);

  return (
    <View style={[styles.container, !isLast && styles.containerWithBorder]}>
      <TouchableOpacity style={styles.content} onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>
            {food.food_name}
          </Text>
          
          {food.brand && (
            <Text style={styles.brandName} numberOfLines={1}>
              {food.brand}
            </Text>
          )}
          
          <View style={styles.portionInfo}>
            <Text style={styles.portionText}>
              {food.portion_grams}g
            </Text>
            <Text style={styles.timeDivider}>•</Text>
            <Text style={styles.timeText}>
              {formatTime(food.logged_at)}
            </Text>
          </View>
        </View>

        <View style={styles.nutritionInfo}>
          <Text style={styles.caloriesText}>
            {Math.round(food.calories_consumed || 0)}
          </Text>
          <Text style={styles.caloriesLabel}>cal</Text>
          
          <View style={styles.macrosRow}>
            <Text style={styles.macroText}>
              P: {Math.round(food.protein_consumed || 0)}g
            </Text>
            <Text style={styles.macroText}>
              C: {Math.round(food.carbs_consumed || 0)}g
            </Text>
            <Text style={styles.macroText}>
              F: {Math.round(food.fat_consumed || 0)}g
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Detailed Macros */}
          <View style={styles.detailedMacros}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(food.calories_consumed || 0)}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(food.protein_consumed || 0)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(food.carbs_consumed || 0)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(food.fat_consumed || 0)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            {food.fiber_consumed && (
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(food.fiber_consumed)}g</Text>
                <Text style={styles.macroLabel}>Fiber</Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {food.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{food.notes}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsInline}>
            {food.food_item_id && !isFavorite(food.food_item_id) && canAddMoreFavorites && (
              <TouchableOpacity style={styles.favoriteButton} onPress={handleAddToFavorites}>
                <Ionicons name="heart-outline" size={16} color={colors.sage} />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity style={styles.editButtonInline} onPress={onEdit}>
                <Ionicons name="pencil" size={16} color={colors.gold} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.deleteButtonInline} onPress={handleDelete}>
                <Ionicons name="trash" size={16} color={colors.crimson} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

