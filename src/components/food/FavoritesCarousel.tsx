import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Card, Button } from '../ui';
import { UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';

interface FavoritesCarouselProps {
  onSelectFood: (food: UnifiedFoodResult) => void;
}

const ITEMS_PER_PAGE = Platform.OS === 'web' ? 3 : 2;

export function FavoritesCarousel({ onSelectFood }: FavoritesCarouselProps) {
  const { colors } = useTheme();
  const { favorites, removeFavorite, isLoading } = useFavorites();
  const [currentPage, setCurrentPage] = useState(0);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    title: {
      ...TextStyles.h4,
      color: colors.text,
      fontWeight: '600',
    },
    counter: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    carouselContainer: {
      position: 'relative',
    },
    scrollContainer: {
      paddingHorizontal: Spacing.xs,
    },
    itemsContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    favoriteItem: {
      width: Platform.OS === 'web' ? 200 : 160,
      backgroundColor: colors.surface,
      borderRadius: Spacing.borderRadius.md,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    removeButton: {
      position: 'absolute',
      top: Spacing.xs,
      right: Spacing.xs,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    foodName: {
      ...TextStyles.bodySmall,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    brandName: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    nutritionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    nutritionItem: {
      alignItems: 'center',
    },
    nutritionValue: {
      ...TextStyles.caption,
      color: colors.text,
      fontWeight: '600',
      fontSize: 11,
    },
    nutritionLabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 9,
    },
    frequencyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    frequencyBadge: {
      backgroundColor: colors.gold + '20',
      borderRadius: Spacing.borderRadius.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
    },
    frequencyText: {
      ...TextStyles.caption,
      color: colors.gold,
      fontSize: 10,
      fontWeight: '600',
    },
    portionText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: Spacing.borderRadius.sm,
      paddingVertical: Spacing.xs,
      alignItems: 'center',
    },
    addButtonText: {
      ...TextStyles.caption,
      color: colors.textOnPrimary,
      fontWeight: '600',
      fontSize: 12,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
      gap: Spacing.md,
    },
    navButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonDisabled: {
      backgroundColor: colors.border,
    },
    pageIndicator: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      minWidth: 60,
      textAlign: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Spacing.borderRadius.md,
      marginHorizontal: Spacing.xs,
    },
    emptyText: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    emptyHint: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }), [colors]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.counter}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.counter}>0 favorites</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorite foods yet</Text>
          <Text style={styles.emptyHint}>Add foods to your favorites for quick access</Text>
        </View>
      </View>
    );
  }

  const totalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const currentPageItems = favorites.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectFood = (favorite: any) => {
    // Convert favorite to UnifiedFoodResult
    const unifiedFood: UnifiedFoodResult = {
      id: favorite.food_item.id,
      name: favorite.food_item.name,
      brand: favorite.food_item.brand,
      source: favorite.food_item.source,
      calories_per_100g: favorite.food_item.calories_per_100g,
      protein_per_100g: favorite.food_item.protein_per_100g,
      carbs_per_100g: favorite.food_item.carbs_per_100g,
      fat_per_100g: favorite.food_item.fat_per_100g,
      fiber_per_100g: favorite.food_item.fiber_per_100g,
      sugar_per_100g: favorite.food_item.sugar_per_100g,
      sodium_per_100g: favorite.food_item.sodium_per_100g,
      isFavorite: true,
    };

    onSelectFood(unifiedFood);
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    removeFavorite(favoriteId);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.counter}>{favorites.length} favorites</Text>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          scrollEnabled={false} // Disable scroll, use navigation buttons instead
        >
          <View style={styles.itemsContainer}>
            {currentPageItems.map((favorite) => {
              const multiplier = favorite.typical_portion_grams / 100;
              const calories = Math.round(favorite.food_item.calories_per_100g * multiplier);
              const protein = Math.round(favorite.food_item.protein_per_100g * multiplier * 10) / 10;
              const carbs = Math.round(favorite.food_item.carbs_per_100g * multiplier * 10) / 10;
              const fat = Math.round(favorite.food_item.fat_per_100g * multiplier * 10) / 10;

              return (
                <View key={favorite.id} style={styles.favoriteItem}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(favorite.id)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  <Text style={styles.foodName} numberOfLines={2}>
                    {favorite.food_item.name}
                  </Text>
                  
                  <Text style={styles.brandName} numberOfLines={1}>
                    {favorite.food_item.brand || ' '}
                  </Text>

                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{calories}</Text>
                      <Text style={styles.nutritionLabel}>cal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{protein}g</Text>
                      <Text style={styles.nutritionLabel}>pro</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{carbs}g</Text>
                      <Text style={styles.nutritionLabel}>car</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{fat}g</Text>
                      <Text style={styles.nutritionLabel}>fat</Text>
                    </View>
                  </View>

                  <View style={styles.frequencyContainer}>
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        Used {favorite.frequency_score}x
                      </Text>
                    </View>
                    <Text style={styles.portionText}>
                      {favorite.typical_portion_grams}g
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSelectFood(favorite)}
                  >
                    <Text style={styles.addButtonText}>Quick Add</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {totalPages > 1 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
              onPress={goToPrevPage}
              disabled={currentPage === 0}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={currentPage === 0 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              {currentPage + 1} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.navButton, currentPage === totalPages - 1 && styles.navButtonDisabled]}
              onPress={goToNextPage}
              disabled={currentPage === totalPages - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={currentPage === totalPages - 1 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}