const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add web extensions for React Native Web support
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"];
config.resolver.platforms = ["web", "native", "ios", "android"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Skip native-only modules on web
  if (platform === 'web') {
    const nativeOnlyModules = [
      'react-native/Libraries/Utilities/codegenNativeCommands',
      './RCTAlertManager',
      'ReactDevToolsSettingsManager',
      './PlatformColorValueTypes',
      './BaseViewConfig',
      'legacySendAccessibilityEvent',
      '../../Utilities/Platform',
      '../Utilities/Platform'
    ];
    
    if (nativeOnlyModules.some(mod => moduleName.includes(mod))) {
      return { type: 'empty' };
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;