import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TextStyles, Spacing } from '../../constants';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry || showPasswordToggle;
  const shouldShowPassword = isPassword && !isPasswordVisible;

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const inputStyle = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || isPassword) && styles.inputWithRightIcon,
    error && styles.inputError,
    isFocused && styles.inputFocused,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={Spacing.iconSize.md}
            color={Colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={inputStyle}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={shouldShowPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={Spacing.iconSize.md}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons
              name={rightIcon}
              size={Spacing.iconSize.md}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
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
  inputContainer: {
    position: 'relative',
  },
  input: {
    ...TextStyles.body,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.padding.input,
    paddingVertical: Spacing.padding.input,
    color: Colors.text,
    minHeight: 44,
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  inputFocused: {
    borderColor: Colors.borderFocus,
  },
  inputError: {
    borderColor: Colors.borderError,
  },
  leftIcon: {
    position: 'absolute',
    left: Spacing.padding.input,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: Spacing.padding.input,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  helperText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
});