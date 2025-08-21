import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, TextStyles, Spacing } from '../../constants';
import { Card, LoadingSpinner } from '../ui';
import { FoodSearchItem } from './FoodSearchItem';
import { useUnifiedFoodSearch, UnifiedFoodResult } from '../../hooks/useUnifiedFoodSearch';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface USDASearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: UnifiedFoodResult) => void;
}

const RECENT_SEARCHES_KEY = '@recent_food_searches';
const MAX_RECENT_SEARCHES = 5;

export function USDASearchModal({ visible, onClose, onSelectFood }: USDASearchModalProps) {
  const { colors } = useTheme();
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
  const [simpleQuery, setSimpleQuery] = useState('');
  const [advancedName, setAdvancedName] = useState('');
  const [advancedBrand, setAdvancedBrand] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const simpleInputRef = useRef<TextInput>(null);
  const advancedNameInputRef = useRef<TextInput>(null);

  const {
    searchResults,
    isSearching,
    error,
    performSearch,
    clearResults,
  } = useUnifiedFoodSearch();

  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      // Focus input when modal opens
      const focusTimeout = setTimeout(() => {
        if (searchMode === 'simple') {
          simpleInputRef.current?.focus();
        } else {
          advancedNameInputRef.current?.focus();
        }
      }, 300);

      return () => clearTimeout(focusTimeout);
    } else {
      // Clear form when modal closes
      setSimpleQuery('');
      setAdvancedName('');
      setAdvancedBrand('');
      clearResults();
    }
  }, [visible, searchMode]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        setRecentSearches(searches);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveToRecentSearches = async (query: string) => {
    try {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery || trimmedQuery.length < 2) return;

      const updatedSearches = [
        trimmedQuery,
        ...recentSearches.filter(s => s !== trimmedQuery)
      ].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const handleSearch = async () => {
    let query = '';
    
    if (searchMode === 'simple') {
      query = simpleQuery.trim();
    } else {
      const name = advancedName.trim();
      const brand = advancedBrand.trim();
      if (name && brand) {
        query = `${brand} ${name}`;
      } else if (name) {
        query = name;
      } else {
        Alert.alert('Search Required', 'Please enter at least a food name to search.');
        return;
      }
    }

    if (!query || query.length < 2) {
      Alert.alert('Search Too Short', 'Please enter at least 2 characters to search.');
      return;
    }

    await performSearch(query);
    await saveToRecentSearches(query);
  };

  const handleRecentSearchPress = async (recentQuery: string) => {
    if (searchMode === 'simple') {
      setSimpleQuery(recentQuery);
    } else {
      // For advanced mode, put the query in name field
      setAdvancedName(recentQuery);
      setAdvancedBrand('');
    }
    
    await performSearch(recentQuery);
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const handleFoodSelect = (food: UnifiedFoodResult) => {
    onSelectFood(food);
    onClose();
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Searching foods..." />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Search Error</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchResults.length === 0 && (simpleQuery || advancedName)) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No foods found</Text>
          <Text style={styles.emptySubtext}>
            Try different keywords or check your spelling
          </Text>
        </View>
      );
    }

    if (searchResults.length > 0) {
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          renderItem={({ item }) => (
            <FoodSearchItem
              food={item}
              onPress={() => handleFoodSelect(item)}
            />
          )}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return null;
  };

  const styles = React.useMemo(() => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: Platform.OS === 'web' ? '90%' : '95%',
      maxWidth: 600,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderRadius: Spacing.borderRadius.lg,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    title: {
      ...TextStyles.h3,
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
    },
    content: {
      flex: 1,
    },
    searchSection: {
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Spacing.borderRadius.sm,
      padding: Spacing.xs,
      marginBottom: Spacing.md,
    },
    modeButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius.xs,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.gold,
    },
    modeButtonText: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    searchForm: {
      gap: Spacing.sm,
    },
    inputContainer: {
      gap: Spacing.xs,
    },
    label: {
      ...TextStyles.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Spacing.borderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...TextStyles.body,
      color: colors.text,
    },
    searchButton: {
      backgroundColor: colors.gold,
      borderRadius: Spacing.borderRadius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    searchButtonText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    recentSection: {
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    recentTitle: {
      ...TextStyles.body,
      color: colors.text,
      fontWeight: '600',
    },
    clearButton: {
      padding: Spacing.xs,
    },
    clearButtonText: {
      ...TextStyles.caption,
      color: colors.crimson,
      fontWeight: '600',
    },
    recentList: {
      gap: Spacing.xs,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.background,
      borderRadius: Spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentText: {
      ...TextStyles.body,
      color: colors.text,
      flex: 1,
    },
    resultsContainer: {
      flex: 1,
    },
    resultsList: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorText: {
      ...TextStyles.h4,
      color: colors.crimson,
      marginBottom: Spacing.sm,
    },
    errorSubtext: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    retryButton: {
      backgroundColor: colors.gold,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius.sm,
    },
    retryText: {
      ...TextStyles.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    emptyText: {
      ...TextStyles.h4,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    emptySubtext: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Foods</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.searchSection}>
              {/* Mode Toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    searchMode === 'simple' && styles.modeButtonActive,
                  ]}
                  onPress={() => setSearchMode('simple')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      searchMode === 'simple' && styles.modeButtonTextActive,
                    ]}
                  >
                    Simple Search
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    searchMode === 'advanced' && styles.modeButtonActive,
                  ]}
                  onPress={() => setSearchMode('advanced')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      searchMode === 'advanced' && styles.modeButtonTextActive,
                    ]}
                  >
                    Advanced
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Form */}
              <View style={styles.searchForm}>
                {searchMode === 'simple' ? (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Food Name</Text>
                    <TextInput
                      ref={simpleInputRef}
                      style={styles.input}
                      value={simpleQuery}
                      onChangeText={setSimpleQuery}
                      placeholder="e.g., chicken breast, apple, pizza"
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="search"
                      onSubmitEditing={handleSearch}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Food Name</Text>
                      <TextInput
                        ref={advancedNameInputRef}
                        style={styles.input}
                        value={advancedName}
                        onChangeText={setAdvancedName}
                        placeholder="e.g., chicken breast"
                        placeholderTextColor={colors.textSecondary}
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Brand (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={advancedBrand}
                        onChangeText={setAdvancedBrand}
                        placeholder="e.g., Tyson, Perdue"
                        placeholderTextColor={colors.textSecondary}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={styles.searchButtonText}>Search Foods</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 && searchResults.length === 0 && !isSearching && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  <TouchableOpacity style={styles.clearButton} onPress={clearRecentSearches}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={`${search}-${index}`}
                      style={styles.recentItem}
                      onPress={() => handleRecentSearchPress(search)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginRight: Spacing.sm }}
                      />
                      <Text style={styles.recentText}>{search}</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Search Results */}
            <View style={styles.resultsContainer}>
              {renderSearchResults()}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}