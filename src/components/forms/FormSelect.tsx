import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList,
  TextInput,
  ViewStyle,
  Platform,
} from 'react-native';
import { Control, Controller, Path, FieldValues } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  containerStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select an option...',
  options,
  containerStyle,
  required = false,
  helperText,
  disabled = false,
  searchable = false,
}: FormSelectProps<T>) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchText.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const openModal = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSearchText('');
  };

  const renderOption = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => {
        // This will be handled by the Controller's onChange
        setIsModalVisible(false);
        setSearchText('');
      }}
    >
      <View style={styles.optionContent}>
        {item.icon && (
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={Colors.primary} 
            style={styles.optionIcon}
          />
        )}
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>{item.label}</Text>
          {item.description && (
            <Text style={styles.optionDescription}>{item.description}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find(option => option.value === value);
        
        return (
          <View style={[styles.container, containerStyle]}>
            {label && (
              <Text style={styles.label}>
                {required ? `${label} *` : label}
              </Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.selectButton,
                disabled && styles.selectButtonDisabled,
                error && styles.selectButtonError,
              ]}
              onPress={openModal}
              disabled={disabled}
            >
              <View style={styles.selectContent}>
                {selectedOption?.icon && (
                  <Ionicons 
                    name={selectedOption.icon} 
                    size={20} 
                    color={Colors.textSecondary} 
                    style={styles.selectedIcon}
                  />
                )}
                <Text style={[
                  styles.selectText,
                  !selectedOption && styles.placeholderText,
                  disabled && styles.disabledText,
                ]}>
                  {selectedOption?.label || placeholder}
                </Text>
              </View>
              
              <Ionicons
                name="chevron-down"
                size={20}
                color={disabled ? Colors.textTertiary : Colors.textSecondary}
              />
            </TouchableOpacity>

            {(error?.message || helperText) && (
              <Text style={[styles.helperText, error && styles.errorText]}>
                {error?.message || helperText}
              </Text>
            )}

            <Modal
              visible={isModalVisible}
              transparent
              animationType="slide"
              onRequestClose={closeModal}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {label || 'Select Option'}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {searchable && (
                    <View style={styles.searchContainer}>
                      <Ionicons 
                        name="search" 
                        size={20} 
                        color={Colors.textSecondary}
                        style={styles.searchIcon}
                      />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search options..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  )}

                  <FlatList
                    data={filteredOptions}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          item.value === value && styles.selectedOptionItem,
                        ]}
                        onPress={() => {
                          onChange(item.value);
                          closeModal();
                        }}
                      >
                        <View style={styles.optionContent}>
                          {item.icon && (
                            <Ionicons 
                              name={item.icon} 
                              size={20} 
                              color={item.value === value ? Colors.primary : Colors.textSecondary} 
                              style={styles.optionIcon}
                            />
                          )}
                          <View style={styles.optionText}>
                            <Text style={[
                              styles.optionLabel,
                              item.value === value && styles.selectedOptionText,
                            ]}>
                              {item.label}
                            </Text>
                            {item.description && (
                              <Text style={styles.optionDescription}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                          {item.value === value && (
                            <Ionicons 
                              name="checkmark" 
                              size={20} 
                              color={Colors.primary}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.value}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </Modal>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...TextStyles.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  selectButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.padding.input,
    paddingVertical: Spacing.padding.input,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.6,
  },
  selectButtonError: {
    borderColor: Colors.borderError,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    marginRight: Spacing.sm,
  },
  selectText: {
    ...TextStyles.body,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textTertiary,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
  helperText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.borderRadius.lg,
    borderTopRightRadius: Spacing.borderRadius.lg,
    maxHeight: '80%',
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...TextStyles.h3,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...TextStyles.body,
    color: Colors.text,
  },
  optionItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  selectedOptionItem: {
    backgroundColor: Colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...TextStyles.body,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  optionDescription: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});