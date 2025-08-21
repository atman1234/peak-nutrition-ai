import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Platform,
  ViewStyle,
} from 'react-native';
import { Control, Controller, Path, FieldValues } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  format?: 'full' | 'short' | 'time';
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  mode = 'date',
  placeholder,
  minimumDate,
  maximumDate,
  containerStyle,
  required = false,
  helperText,
  disabled = false,
  format = 'full',
}: FormDatePickerProps<T>) {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'time':
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'full':
      default:
        if (mode === 'time') {
          return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (mode === 'datetime') {
          return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
    }
  };

  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    
    switch (mode) {
      case 'time':
        return 'Select time';
      case 'datetime':
        return 'Select date and time';
      case 'date':
      default:
        return 'Select date';
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (mode) {
      case 'time':
        return 'time-outline';
      case 'datetime':
        return 'calendar-outline';
      case 'date':
      default:
        return 'calendar-outline';
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : null;
        
        return (
          <View style={[styles.container, containerStyle]}>
            {label && (
              <Text style={styles.label}>
                {required ? `${label} *` : label}
              </Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.pickerButton,
                disabled && styles.pickerButtonDisabled,
                error && styles.pickerButtonError,
              ]}
              onPress={() => !disabled && setShowPicker(true)}
              disabled={disabled}
            >
              <View style={styles.pickerContent}>
                <Ionicons 
                  name={getIcon()}
                  size={20} 
                  color={disabled ? Colors.textTertiary : Colors.textSecondary}
                  style={styles.pickerIcon}
                />
                <Text style={[
                  styles.pickerText,
                  !dateValue && styles.placeholderText,
                  disabled && styles.disabledText,
                ]}>
                  {dateValue ? formatDate(dateValue) : getPlaceholder()}
                </Text>
              </View>
              
              {!disabled && (
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={Colors.textSecondary}
                />
              )}
            </TouchableOpacity>

            {(error?.message || helperText) && (
              <Text style={[styles.helperText, error && styles.errorText]}>
                {error?.message || helperText}
              </Text>
            )}

            {Platform.OS === 'ios' ? (
              <Modal
                visible={showPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setShowPicker(false)}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>
                        {label || getPlaceholder()}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowPicker(false);
                        }}
                      >
                        <Text style={styles.doneButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <DateTimePicker
                      value={dateValue || new Date()}
                      mode={mode}
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          onChange(selectedDate);
                        }
                      }}
                      minimumDate={minimumDate}
                      maximumDate={maximumDate}
                      style={styles.picker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showPicker && (
                <DateTimePicker
                  value={dateValue || new Date()}
                  mode={mode}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (event.type === 'set' && selectedDate) {
                      onChange(selectedDate);
                    }
                  }}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                />
              )
            )}
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
  pickerButton: {
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
  pickerButtonDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.6,
  },
  pickerButtonError: {
    borderColor: Colors.borderError,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerIcon: {
    marginRight: Spacing.sm,
  },
  pickerText: {
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
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...TextStyles.h3,
    color: Colors.text,
  },
  cancelButton: {
    ...TextStyles.body,
    color: Colors.textSecondary,
  },
  doneButton: {
    ...TextStyles.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  picker: {
    width: '100%',
  },
});