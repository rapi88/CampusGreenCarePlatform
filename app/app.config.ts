import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'app',
  slug: 'app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/applogo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/applogo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.app',
  },
  android: {
    package: 'com.anonymous.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/applogo.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/applogo.png',
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID ?? '909462bd-54df-4213-bd5e-d0431196e913',
    },
  },
  plugins: [
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsImpl: 'mapbox',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/applogo.png',
        color: '#2E7D32',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Profil fotoğrafı ayarlamak için Campus Green Care uygulamasının fotoğraflarınıza erişmesine izin verin.',
        cameraPermission: 'Profil fotoğrafı çekmek için Campus Green Care uygulamasının kamerayı kullanmasına izin verin.',
      },
    ],
  ],
});
