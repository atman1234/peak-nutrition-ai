module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          reanimated: false,
        }
      ]
    ],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.web.js', '.web.ts', '.web.tsx', '.native.js', '.native.ts', '.native.tsx']
        }
      ],
      'react-native-reanimated/plugin',
    ],
  };
};