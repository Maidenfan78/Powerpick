// app.config.ts
import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // ← make sure these match your package IDs
  android: {
    package: process.env.ANDROID_PACKAGE || "com.maidenfan.powerpick",
  },
  ios: {
    bundleIdentifier:
      process.env.IOS_BUNDLE_IDENTIFIER || "com.maidenfan.powerpick",
          infoPlist: {
      /**
       * false = “My app does NOT use non-exempt encryption”
       * true  = “My app DOES use it” (rare for JS/TS apps)
       */
      ITSAppUsesNonExemptEncryption: false,
   },     
  },

  // your existing fields
  name: config.name!,
  slug: config.slug!,
  version: config.version!,
  sdkVersion: config.sdkVersion!,

  extra: {
    // supabase
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY!,

    // ← EAS Project ID (set this in your CI env as a secret)
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID || "086c12a9-8bb3-4b15-989a-9451bbcc6e7d",
    },
  },
});
