// Web-compatible mock for React Native RCTAlertManager
// This handles native alert functionality on web using browser alerts

export default {
  alertWithArgs: (args) => {
    const { title, message, buttons } = args;
    
    // Simple browser alert for web
    if (buttons && buttons.length > 0) {
      // For complex alerts with multiple buttons, use confirm
      const result = window.confirm(`${title || ''}\n${message || ''}`);
      if (buttons[0].onPress) {
        buttons[result ? 1 : 0]?.onPress?.();
      }
    } else {
      // Simple alert
      window.alert(`${title || ''}\n${message || ''}`);
    }
  }
};

// Export individual functions as well
export const alertWithArgs = (args) => {
  const { title, message, buttons } = args;
  
  if (buttons && buttons.length > 1) {
    const result = window.confirm(`${title || ''}\n${message || ''}`);
    if (result && buttons[1]?.onPress) buttons[1].onPress();
    else if (!result && buttons[0]?.onPress) buttons[0].onPress();
  } else {
    window.alert(`${title || ''}\n${message || ''}`);
    if (buttons?.[0]?.onPress) buttons[0].onPress();
  }
};