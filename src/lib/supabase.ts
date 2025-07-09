// lib/supabase.ts
//import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Safely read Supabase credentials from app config or environment variables
const extra = Constants.expoConfig?.extra ?? {};
const EXPO_PUBLIC_SUPABASE_URL =
  extra.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const EXPO_PUBLIC_SUPABASE_ANON_KEY =
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  const missing = [];
  if (!EXPO_PUBLIC_SUPABASE_URL) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!EXPO_PUBLIC_SUPABASE_ANON_KEY)
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  throw new Error(
    `Supabase credentials missing. Please set ${missing.join(
      " and ",
    )} in your app config or environment variables.`,
  );
}

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
