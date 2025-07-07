/* eslint-disable react-native/no-unused-styles */
import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Auth from "../src/components/Auth";
import { useTheme } from "../src/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { tokens } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        close: { color: tokens.color.neutral["0"].value, fontSize: 20 },
        container: {
          backgroundColor: tokens.color.brand.primary.value,
          flex: 1,
          padding: 16,
        },
        header: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        title: { color: tokens.color.neutral["0"].value, fontSize: 20 },
      }),
    [tokens],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign In</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <Auth />
    </SafeAreaView>
  );
}
