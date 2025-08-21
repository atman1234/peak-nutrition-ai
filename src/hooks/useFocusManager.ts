import { useRef, useCallback } from 'react';
import { TextInput } from 'react-native';

interface FocusManager {
  refs: { [key: string]: React.RefObject<TextInput> };
  registerField: (name: string) => React.RefObject<TextInput>;
  focusNext: (currentField: string, fieldOrder: string[]) => void;
  focusPrevious: (currentField: string, fieldOrder: string[]) => void;
  blurAll: () => void;
  focusField: (fieldName: string) => void;
}

export function useFocusManager(): FocusManager {
  const refs = useRef<{ [key: string]: React.RefObject<TextInput> }>({});

  const registerField = useCallback((name: string): React.RefObject<TextInput> => {
    if (!refs.current[name]) {
      refs.current[name] = React.createRef<TextInput>();
    }
    return refs.current[name];
  }, []);

  const focusNext = useCallback((currentField: string, fieldOrder: string[]) => {
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      if (refs.current[nextField]?.current) {
        refs.current[nextField].current?.focus();
      }
    }
  }, []);

  const focusPrevious = useCallback((currentField: string, fieldOrder: string[]) => {
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex > 0) {
      const previousField = fieldOrder[currentIndex - 1];
      if (refs.current[previousField]?.current) {
        refs.current[previousField].current?.focus();
      }
    }
  }, []);

  const blurAll = useCallback(() => {
    Object.values(refs.current).forEach(ref => {
      ref.current?.blur();
    });
  }, []);

  const focusField = useCallback((fieldName: string) => {
    if (refs.current[fieldName]?.current) {
      refs.current[fieldName].current?.focus();
    }
  }, []);

  return {
    refs: refs.current,
    registerField,
    focusNext,
    focusPrevious,
    blurAll,
    focusField,
  };
}