const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable CSS support for web (needed for mapbox-gl)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

module.exports = config;
