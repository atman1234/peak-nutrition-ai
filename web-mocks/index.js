// General fallback mock for native-only modules
export default {};

// Common native module exports that might be missing on web
export const codegenNativeCommands = () => {};
export const requireNativeComponent = () => null;
export const NativeModules = {};
export const Platform = {
  OS: 'web',
  select: (options) => options.web || options.default,
};