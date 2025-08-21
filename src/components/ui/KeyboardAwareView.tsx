import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ViewStyle,
} from 'react-native';
import { useKeyboard } from '../../hooks/useKeyboard';
import { Spacing } from '../../constants';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollEnabled?: boolean;
  dismissKeyboardOnTap?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardVerticalOffset?: number;
  enableAutomaticScroll?: boolean;
}

export function KeyboardAwareView({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  dismissKeyboardOnTap = true,
  showsVerticalScrollIndicator = false,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 60 : 20,
  enableAutomaticScroll = true,
}: KeyboardAwareViewProps) {
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  const handleTouchOutside = () => {
    if (dismissKeyboardOnTap && isKeyboardVisible) {
      Keyboard.dismiss();
    }
  };

  const ContentWrapper = ({ children: contentChildren }: { children: React.ReactNode }) => (
    <TouchableWithoutFeedback onPress={dismissKeyboardOnTap ? handleTouchOutside : undefined}>
      <View style={[styles.container, style]}>
        {contentChildren}
      </View>
    </TouchableWithoutFeedback>
  );

  if (!scrollEnabled) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        style={[styles.scrollView, style]}
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
          isKeyboardVisible && enableAutomaticScroll && {
            paddingBottom: Platform.OS === 'android' ? keyboardHeight / 4 : Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboardOnTap ? handleTouchOutside : undefined}>
          <View style={styles.touchableContent}>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  touchableContent: {
    flex: 1,
  },
});