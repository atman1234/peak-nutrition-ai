import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { useUnifiedFoodSearch, UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import { Colors, TextStyles, Spacing } from '../../constants';
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const { searchUnifiedFoods } = useUnifiedFoodSearch();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value]);

  // Perform search when debounced term changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUnifiedFoods(debouncedSearchTerm, 8);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]); // Remove searchUnifiedFoods dependency

  const handleFocus = () => {
    if (!disabled && value.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);
    
    if (text.length >= 2 && !disabled) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
      setIsSearching(false);
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
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        autoFocus={autoFocus}
        editable={!disabled}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
      />
      
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
                        {searchResults.length} results for "{debouncedSearchTerm}"
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
                            No foods found for "{debouncedSearchTerm}"
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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    ...TextStyles.body,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: 16, // Prevent zoom on iOS
  },
  inputError: {
    borderColor: Colors.crimson,
  },
  inputDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.textSecondary,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.crimson,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  suggestionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    maxHeight: '70%',
    shadowColor: Colors.shadow,
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
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: Spacing.borderRadius.lg,
    borderTopRightRadius: Spacing.borderRadius.lg,
  },
  resultsHeaderText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});