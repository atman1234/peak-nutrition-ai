import React, { useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextInput } from 'react-native';
import { Control, Controller, FieldError, Path, FieldValues } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Colors, TextStyles, Spacing } from '../../constants';
import { Ionicons } from '@expo/vector-icons';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  autoCorrect?: boolean;
  maxLength?: number;
  editable?: boolean;
  containerStyle?: ViewStyle;
  helperText?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  enableHapticFeedback?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' | 'previous';
  fieldRef?: React.RefObject<TextInput>;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  autoCorrect = true,
  maxLength,
  editable = true,
  containerStyle,
  helperText,
  required = false,
  showPasswordToggle = false,
  enableHapticFeedback = true,
  autoFocus = false,
  onSubmitEditing,
  returnKeyType = 'done',
  fieldRef,
}: FormFieldProps<T>) {
  const defaultRef = useRef<TextInput>(null);
  const inputRef = fieldRef || defaultRef;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          <Input
            ref={inputRef}
            label={required && label ? `${label} *` : label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            onRightIconPress={onRightIconPress}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            maxLength={maxLength}
            editable={editable}
            error={error?.message}
            helperText={!error?.message ? helperText : undefined}
            showPasswordToggle={showPasswordToggle}
            multiline={multiline}
            numberOfLines={numberOfLines}
            enableHapticFeedback={enableHapticFeedback}
            autoFocus={autoFocus}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
          />
          
          {/* Additional validation feedback for complex fields */}
          {error && error.type === 'too_small' && (
            <View style={styles.validationHint}>
              <Ionicons 
                name="information-circle" 
                size={16} 
                color={Colors.warning} 
                style={styles.hintIcon}
              />
              <Text style={styles.hintText}>
                Minimum value required
              </Text>
            </View>
          )}
          
          {error && error.type === 'too_big' && (
            <View style={styles.validationHint}>
              <Ionicons 
                name="warning" 
                size={16} 
                color={Colors.warning} 
                style={styles.hintIcon}
              />
              <Text style={styles.hintText}>
                Value exceeds maximum limit
              </Text>
            </View>
          )}
          
          {/* Character count for text fields with maxLength */}
          {maxLength && value && typeof value === 'string' && (
            <Text style={styles.characterCount}>
              {value.length}/{maxLength}
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
  validationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  hintIcon: {
    marginRight: Spacing.xs,
  },
  hintText: {
    ...TextStyles.caption,
    color: Colors.warning,
    flex: 1,
  },
  characterCount: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});