import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnifiedFoodSearch, UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { LoadingSpinner } from '../ui';
import { FoodSearchItem } from './FoodSearchItem';

interface FoodAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectFood: (food: UnifiedFoodResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
}

export function FoodAutocomplete({
  value,
  onChangeText,
  onSelectFood,
  placeholder = "Search for food...",
  autoFocus = false,
  disabled = false,
  error,
}: FoodAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedFoodResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { colors } = useTheme();
  const { searchUnifiedFoods } = useUnifiedFoodSearch();

  // Create dynamic styles based on theme
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      position: 'relative',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      ...TextStyles.body,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 16, // Prevent zoom on iOS
    },
    inputError: {
      borderColor: colors.error,
    },
    inputDisabled: {
      backgroundColor: colors.backgroundSecondary,
      color: colors.textSecondary,
    },
    errorText: {
      ...TextStyles.caption,
      color: colors.error,
      marginTop: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
    },
    suggestionsContainer: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.borderRadius.lg,
      maxHeight: '70%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    loadingContainer: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    resultsHeader: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: Spacing.borderRadius.lg,
      borderTopRightRadius: Spacing.borderRadius.lg,
    },
    resultsHeaderText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    resultsList: {
      flex: 1,
    },
    emptyContainer: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...TextStyles.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    emptySubtext: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchButton: {
      backgroundColor: colors.gold,
      borderRadius: Spacing.borderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    searchButtonText: {
      ...TextStyles.bodySmall,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    searchHint: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
  }), [colors]);

  // Manual search function
  const performSearch = useCallback(async () => {
    if (value.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);
    setHasSearched(true);
    
    try {
      const results = await searchUnifiedFoods(value, 8);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [value, searchUnifiedFoods]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      performSearch();
    }
  }, [performSearch]);

  const handleFocus = () => {
    // Only show suggestions if we have previous results and search has been performed
    if (!disabled && hasSearched && searchResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);
    
    // Clear results when input changes to prevent stale results
    if (text !== value) {
      setSearchResults([]);
      setShowSuggestions(false);
      setHasSearched(false);
    }
  };

  const handleSelectFood = (food: UnifiedFoodResult) => {
    onSelectFood(food);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleCloseModal = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const renderSearchItem = ({ item }: { item: UnifiedFoodResult }) => (
    <FoodSearchItem
      food={item}
      onPress={() => handleSelectFood(item)}
    />
  );

  const keyExtractor = (item: UnifiedFoodResult) => 
    `${item.source}_${item.id}`;

  const showResults = showSuggestions && (searchResults.length > 0 || isSearching);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoFocus={autoFocus}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={performSearch}
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        />
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={performSearch}
          disabled={disabled || value.length < 2}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.searchHint}>
        Press Enter or click search to find foods
      </Text>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={showResults}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.suggestionsContainer}>
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <LoadingSpinner size="small" text="Searching foods..." />
                  </View>
                ) : (
                  <>
                    <View style={styles.resultsHeader}>
                      <Text style={styles.resultsHeaderText}>
                        {searchResults.length} results for "{value}"
                      </Text>
                    </View>
                    
                    <FlatList
                      data={searchResults}
                      renderItem={renderSearchItem}
                      keyExtractor={keyExtractor}
                      style={styles.resultsList}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      maxToRenderPerBatch={8}
                      windowSize={10}
                      removeClippedSubviews={Platform.OS === 'android'}
                      ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>
                            No foods found for "{value}"
                          </Text>
                          <Text style={styles.emptySubtext}>
                            Try a different search term or check your spelling
                          </Text>
                        </View>
                      )}
                    />
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

