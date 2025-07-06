import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // App identity
  scheme: 'powerpick',
  name: 'powerpick',
  slug: 'powerpick',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  // Splash screen
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Android configuration
  android: {
    package: process.env.ANDROID_PACKAGE || 'com.maidenfan.powerpick',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },

  // iOS configuration (if needed for Expo Go or future builds)
  ios: {
    bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.maidenfan.powerpick',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  // Web configuration
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'static',
  },

  // Plugins (build-properties first to ensure Kotlin version override)
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          // align Kotlin plugin version with stdlib
          kotlinVersion: '2.1.20',
        },
      },
    ],
    'expo-router',
  ],

  // Supported platforms
  platforms: ['android', 'web'],

  // Extra runtime values: env vars only (no hardcoded secrets)
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID || '086c12a9-8bb3-4b15-989a-9451bbcc6e7d',
    },
  },

  owner: 'maidenfan',
});
