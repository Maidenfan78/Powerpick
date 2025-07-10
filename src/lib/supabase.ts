// lib/supabase.ts
//import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Safely read Supabase credentials from app config or environment variables
const extra = Constants.expoConfig?.extra ?? {};
const EXPO_PUBLIC_SUPABASE_URL =
  extra.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const READ_KEY =
  extra.EXPO_PUBLIC_SUPABASE_READ_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_READ_KEY ||
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const WRITE_KEY =
  extra.EXPO_PUBLIC_SUPABASE_WRITE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_WRITE_KEY;

const SUPABASE_KEY = READ_KEY || WRITE_KEY;

if (!EXPO_PUBLIC_SUPABASE_URL || !SUPABASE_KEY) {
  const missing = [];
  if (!EXPO_PUBLIC_SUPABASE_URL) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!READ_KEY && !WRITE_KEY)
    missing.push("EXPO_PUBLIC_SUPABASE_READ_KEY or EXPO_PUBLIC_SUPABASE_WRITE_KEY");
  throw new Error(
    `Supabase credentials missing. Please set ${missing.join(
      " and ",
    )} in your app config or environment variables.`,
  );
}

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY,
);
