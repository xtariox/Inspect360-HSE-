module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: [
            '@tamagui/core',
            '@tamagui/button',
            '@tamagui/card', 
            '@tamagui/input',
            '@tamagui/stacks',
            '@tamagui/lucide-icons'
          ],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development'
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};