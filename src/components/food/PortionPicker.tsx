import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';
import { Card } from '../ui';

interface PortionPickerProps {
  value: number;
  onChange: (grams: number) => void;
  suggestions?: number[];
  foodName?: string;
  error?: string;
}

const COMMON_PORTIONS = [
  { label: '1/4 cup', grams: 60 },
  { label: '1/2 cup', grams: 120 },
  { label: '1 cup', grams: 240 },
  { label: '1 tbsp', grams: 15 },
  { label: '1 tsp', grams: 5 },
  { label: '1 slice', grams: 30 },
  { label: '1 medium', grams: 150 },
  { label: '1 large', grams: 200 },
  { label: '100g', grams: 100 },
  { label: '200g', grams: 200 },
];

export function PortionPicker({ 
  value, 
  onChange, 
  suggestions = [], 
  foodName,
  error 
}: PortionPickerProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue <= 0) {
      setInputValue(value.toString());
    }
  };

  const handleQuickSelect = (grams: number) => {
    onChange(grams);
    setInputValue(grams.toString());
  };

  const adjustPortion = (delta: number) => {
    const newValue = Math.max(1, value + delta);
    onChange(newValue);
  };

  // Combine suggestions with common portions, remove duplicates
  const allSuggestions = [
    ...suggestions.map(g => ({ label: `${g}g`, grams: g, isCustom: true })),
    ...COMMON_PORTIONS.filter(p => !suggestions.includes(p.grams)).map(p => ({ ...p, isCustom: false })),
  ].slice(0, 8); // Limit to 8 suggestions

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Portion Size</Text>
      
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustPortion(-10)}
          >
            <Ionicons name="remove" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={inputValue}
              onChangeText={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              keyboardType="numeric"
              returnKeyType="done"
              selectTextOnFocus
              placeholder="100"
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.unit}>grams</Text>
          </View>
          
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustPortion(10)}
          >
            <Ionicons name="add" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {allSuggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Quick Select</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {allSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.grams}-${index}`}
                style={[
                  styles.suggestionChip,
                  value === suggestion.grams && styles.suggestionChipActive,
                  suggestion.isCustom && styles.suggestionChipCustom,
                ]}
                onPress={() => handleQuickSelect(suggestion.grams)}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    value === suggestion.grams && styles.suggestionTextActive,
                    suggestion.isCustom && styles.suggestionTextCustom,
                  ]}
                >
                  {suggestion.label}
                </Text>
                {suggestion.isCustom && (
                  <Ionicons 
                    name="star" 
                    size={12} 
                    color={value === suggestion.grams ? Colors.surface : Colors.gold} 
                    style={styles.suggestionIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {foodName && value !== 100 && (
        <View style={styles.equivalentSection}>
          <Text style={styles.equivalentText}>
            = {Math.round((value / 100) * 100)}% of a 100g reference serving
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  title: {
    ...TextStyles.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    ...TextStyles.body,
    color: Colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputError: {
    borderColor: Colors.crimson,
  },
  unit: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.crimson,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  suggestionsSection: {
    marginBottom: Spacing.md,
  },
  suggestionsTitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  suggestionsScroll: {
    paddingRight: Spacing.md,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Spacing.borderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  suggestionChipCustom: {
    borderColor: Colors.sage,
  },
  suggestionText: {
    ...TextStyles.body,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  suggestionTextCustom: {
    color: Colors.sage,
  },
  suggestionIcon: {
    marginLeft: Spacing.xs,
  },
  equivalentSection: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  equivalentText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});