// Web-compatible mock for expo-asset/build/resolveAssetSource
export default function resolveAssetSource(source) {
  if (typeof source === 'number') {
    // For require() asset numbers, return a basic structure
    return {
      uri: '',
      width: 0,
      height: 0,
      scale: 1,
    };
  }
  
  if (typeof source === 'object' && source.uri) {
    return source;
  }
  
  if (typeof source === 'string') {
    return {
      uri: source,
      width: 0,
      height: 0,
      scale: 1,
    };
  }
  
  return {
    uri: '',
    width: 0,
    height: 0,
    scale: 1,
  };
}