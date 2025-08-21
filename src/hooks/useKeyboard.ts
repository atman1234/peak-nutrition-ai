import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

interface KeyboardInfo {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

export function useKeyboard(): KeyboardInfo {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setKeyboardInfo({
        isKeyboardVisible: true,
        keyboardHeight: e.endCoordinates.height,
      });
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardInfo({
        isKeyboardVisible: false,
        keyboardHeight: 0,
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardInfo;
}