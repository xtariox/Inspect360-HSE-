// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure these platforms are enabled for universal apps
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Alias dompurify to resolve module issues with jspdf
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  dompurify: require.resolve('dompurify'),
};

module.exports = config;

