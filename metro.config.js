const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add web extensions for React Native Web support
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"];

module.exports = config;