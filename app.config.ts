import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // Core project settings
  scheme: "powerpick",
  name: "powerpick",
  slug: "powerpick",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
  },

  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    output: "static",
  },

  // Add expo-router and build-properties plugins
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: { kotlinVersion: "2.1.20" },
      },
    ],
  ],

  platforms: ["android", "web"],

  extra: {
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      "https://damfzsmplbsbraqcmagv.supabase.co",
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbWZ6c21wbGJzYnJhcWNtYWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTQwMzMsImV4cCI6MjA2NTczMDAzM30._LfMdf8vPvwfzfnQbAqkEX7OiZyPaVdsKr9VlhUT-UM",
    router: {},
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID || "086c12a9-8bb3-4b15-989a-9451bbcc6e7d",
    },
  },

  owner: "maidenfan",
});
