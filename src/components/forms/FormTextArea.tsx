import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Control, Controller, Path, FieldValues } from 'react-hook-form';
import { Colors, TextStyles, Spacing } from '../../constants';

interface FormTextAreaProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  numberOfLines?: number;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  containerStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  showCharacterCount?: boolean;
}

export function FormTextArea<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  numberOfLines = 4,
  maxLength,
  minHeight = 100,
  maxHeight = 200,
  containerStyle,
  required = false,
  helperText,
  disabled = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  showCharacterCount = true,
}: FormTextAreaProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          {label && (
            <Text style={styles.label}>
              {required ? `${label} *` : label}
            </Text>
          )}
          
          <View style={[
            styles.textAreaContainer,
            error && styles.textAreaContainerError,
            disabled && styles.textAreaContainerDisabled,
          ]}>
            <TextInput
              style={[
                styles.textArea,
                { 
                  minHeight: minHeight,
                  maxHeight: maxHeight,
                },
                disabled && styles.textAreaDisabled,
              ]}
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              placeholderTextColor={Colors.textTertiary}
              multiline={true}
              numberOfLines={numberOfLines}
              maxLength={maxLength}
              editable={!disabled}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.bottomContainer}>
            {(error?.message || helperText) && (
              <Text style={[styles.helperText, error && styles.errorText]}>
                {error?.message || helperText}
              </Text>
            )}
            
            {showCharacterCount && maxLength && (
              <Text style={[
                styles.characterCount,
                (value?.length || 0) >= maxLength * 0.9 && styles.characterCountNearLimit,
                (value?.length || 0) >= maxLength && styles.characterCountAtLimit,
              ]}>
                {value?.length || 0}/{maxLength}
              </Text>
            )}
          </View>

          {/* Word count for longer text areas */}
          {(value?.length || 0) > 50 && (
            <Text style={styles.wordCount}>
              Words: {(value || '').trim().split(/\s+/).filter(word => word.length > 0).length}
            </Text>
          )}
        </View>
      )}
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
  textAreaContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.padding.input,
  },
  textAreaContainerError: {
    borderColor: Colors.borderError,
  },
  textAreaContainerDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.6,
  },
  textArea: {
    ...TextStyles.body,
    color: Colors.text,
    padding: 0, // Remove default padding to control it via container
    includeFontPadding: false,
  },
  textAreaDisabled: {
    color: Colors.textTertiary,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  helperText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
  },
  characterCount: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  characterCountNearLimit: {
    color: Colors.warning,
  },
  characterCountAtLimit: {
    color: Colors.error,
  },
  wordCount: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
  },
});