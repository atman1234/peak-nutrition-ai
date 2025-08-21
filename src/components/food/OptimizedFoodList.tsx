import React, { memo, useMemo, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { Colors, TextStyles, Spacing } from '../../constants';
import { LoadingSpinner } from '../ui';

interface OptimizedFoodListProps {
  data: UnifiedFoodResult[];
  onItemPress: (item: UnifiedFoodResult) => void;
  onItemLongPress?: (item: UnifiedFoodResult) => void;
  onAddToFavorites?: (item: UnifiedFoodResult) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  showNutritionPreview?: boolean;
  estimatedItemSize?: number;
  numColumns?: number;
  enableHapticFeedback?: boolean;
}

// Memoized food item component for optimal performance
const FoodListItem = memo<{
  item: UnifiedFoodResult;
  onPress: (item: UnifiedFoodResult) => void;
  onLongPress?: (item: UnifiedFoodResult) => void;
  onAddToFavorites?: (item: UnifiedFoodResult) => void;
  showNutritionPreview: boolean;
  enableHapticFeedback: boolean;
}>(({ 
  item, 
  onPress, 
  onLongPress, 
  onAddToFavorites, 
  showNutritionPreview,
  enableHapticFeedback,
}) => {
  const [imageError, setImageError] = useState(false);

  const handlePress = useCallback(async () => {
    if (enableHapticFeedback) {
      await Haptics.selectionAsync();
    }
    onPress(item);
  }, [item, onPress, enableHapticFeedback]);

  const handleLongPress = useCallback(async () => {
    if (enableHapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.(item);
  }, [item, onLongPress, enableHapticFeedback]);

  const handleFavoritePress = useCallback(async (e: any) => {
    e.stopPropagation();
    if (enableHapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAddToFavorites?.(item);
  }, [item, onAddToFavorites, enableHapticFeedback]);

  const getResultTypeInfo = useMemo(() => {
    switch (item.resultType) {
      case 'favorite':
        return {
          icon: 'star' as keyof typeof Ionicons.glyphMap,
          color: Colors.favorite,
          label: 'Favorite',
        };
      case 'saved':
        return {
          icon: 'heart' as keyof typeof Ionicons.glyphMap,
          color: Colors.heart,
          label: 'Previously used',
        };
      case 'usda_foundation':
        return {
          icon: 'library-outline' as keyof typeof Ionicons.glyphMap,
          color: Colors.info,
          label: 'USDA Foundation',
        };
      case 'usda_branded':
        return {
          icon: 'business-outline' as keyof typeof Ionicons.glyphMap,
          color: Colors.textSecondary,
          label: 'USDA Branded',
        };
      default:
        return {
          icon: 'nutrition-outline' as keyof typeof Ionicons.glyphMap,
          color: Colors.textSecondary,
          label: 'Food Database',
        };
    }
  }, [item.resultType]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemContainer,
        pressed && styles.itemPressed,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
    >
      <View style={styles.itemContent}>
        {/* Food image placeholder */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image
              source={{ uri: `https://via.placeholder.com/60x60/e1e1e1/666666?text=${item.name.charAt(0)}` }}
              style={styles.foodImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons 
                name="restaurant-outline" 
                size={24} 
                color={Colors.textSecondary} 
              />
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.foodName} numberOfLines={1}>
              {item.name}
            </Text>
            
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: getResultTypeInfo.color + '20' }]}>
                <Ionicons 
                  name={getResultTypeInfo.icon} 
                  size={12} 
                  color={getResultTypeInfo.color} 
                />
              </View>
              
              {onAddToFavorites && !item.isFavorite && (
                <Pressable
                  style={styles.favoriteButton}
                  onPress={handleFavoritePress}
                >
                  <Ionicons 
                    name="heart-outline" 
                    size={16} 
                    color={Colors.textSecondary} 
                  />
                </Pressable>
              )}
            </View>
          </View>

          {item.brand && (
            <Text style={styles.brandName} numberOfLines={1}>
              {item.brand}
            </Text>
          )}

          {showNutritionPreview && (
            <View style={styles.nutritionPreview}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(item.calories_per_100g || 0)}
                </Text>
                <Text style={styles.nutritionLabel}>cal</Text>
              </View>
              
              <View style={styles.nutritionDivider} />
              
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {(item.protein_per_100g || 0).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              
              <View style={styles.nutritionDivider} />
              
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {(item.carbs_per_100g || 0).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              
              <View style={styles.nutritionDivider} />
              
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {(item.fat_per_100g || 0).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
          )}

          {/* Relevance score indicator */}
          {item.relevanceScore && item.relevanceScore < 1 && (
            <View style={styles.relevanceContainer}>
              <View 
                style={[
                  styles.relevanceBar, 
                  { width: `${item.relevanceScore * 100}%` }
                ]} 
              />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

FoodListItem.displayName = 'FoodListItem';

export function OptimizedFoodList({
  data,
  onItemPress,
  onItemLongPress,
  onAddToFavorites,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  emptyMessage = 'No foods found',
  showNutritionPreview = true,
  estimatedItemSize = 80,
  numColumns = 1,
  enableHapticFeedback = true,
}: OptimizedFoodListProps) {
  const renderItem: ListRenderItem<UnifiedFoodResult> = useCallback(
    ({ item }) => (
      <FoodListItem
        item={item}
        onPress={onItemPress}
        onLongPress={onItemLongPress}
        onAddToFavorites={onAddToFavorites}
        showNutritionPreview={showNutritionPreview}
        enableHapticFeedback={enableHapticFeedback}
      />
    ),
    [
      onItemPress,
      onItemLongPress,
      onAddToFavorites,
      showNutritionPreview,
      enableHapticFeedback,
    ]
  );

  const keyExtractor = useCallback(
    (item: UnifiedFoodResult, index: number) => `${item.id}-${index}`,
    []
  );

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      ) : undefined,
    [onRefresh, isRefreshing]
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="search-outline" 
          size={64} 
          color={Colors.textTertiary} 
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        {isLoading && (
          <LoadingSpinner 
            size="small" 
            color={Colors.primary} 
            style={styles.emptySpinner}
          />
        )}
      </View>
    ),
    [emptyMessage, isLoading]
  );

  const footerComponent = useMemo(
    () =>
      isLoading && data.length > 0 ? (
        <View style={styles.footerLoader}>
          <LoadingSpinner size="small" color={Colors.primary} />
        </View>
      ) : null,
    [isLoading, data.length]
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={estimatedItemSize}
        numColumns={numColumns}
        refreshControl={refreshControl}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={data.length === 0 ? styles.emptyListContent : undefined}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        updateCellsBatchingPeriod={100}
        // Accessibility
        accessible={true}
        accessibilityLabel="Food search results"
      />
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  itemContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.md,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  itemContent: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: Spacing.md,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: Spacing.borderRadius.md,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  foodName: {
    ...TextStyles.body,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  brandName: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
  },
  nutritionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 45,
  },
  nutritionValue: {
    ...TextStyles.caption,
    fontWeight: '600',
    color: Colors.text,
  },
  nutritionLabel: {
    ...TextStyles.tiny,
    color: Colors.textTertiary,
  },
  nutritionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  relevanceContainer: {
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  relevanceBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptySpinner: {
    marginTop: Spacing.md,
  },
  footerLoader: {
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});