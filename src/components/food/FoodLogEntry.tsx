import React from 'react';
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

type FoodLog = Tables<'food_logs'>;

interface FoodLogEntryProps {
  food: FoodLog;
  onEdit?: () => void;
  onDelete?: () => void;
  isLast?: boolean;
}

export function FoodLogEntry({ food, onEdit, onDelete, isLast = false }: FoodLogEntryProps) {
  const { colors } = useTheme();
  
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
  }), [colors]);

  return (
    <View style={[styles.container, !isLast && styles.containerWithBorder]}>
      <View style={styles.content}>
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

        {/* Simple edit/delete buttons */}
        {(onEdit || onDelete) && (
          <View style={styles.actionButtonsInline}>
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
        )}
      </View>

    </View>
  );
}

