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
          alias: {
            '@stripe/stripe-react-native': './src/services/stripe',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.web.js', '.native.js']
        }
      ],
      'react-native-reanimated/plugin',
    ],
  };
};