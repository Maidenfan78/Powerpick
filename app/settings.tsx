// app/settings.tsx
/* eslint-disable react-native/no-unused-styles */
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
} from "react-native";
import { useMemo } from "react";
import { useTheme } from "../src/lib/theme";
import { useRouter } from "expo-router";
import { SCREEN_BG } from "../src/lib/constants";

export default function SettingsScreen() {
  const { tokens, scheme, toggleScheme } = useTheme();
  const router = useRouter();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: tokens.color.neutral["0"].value,
          borderRadius: 12,
          elevation: 1,
          marginHorizontal: 16,
          marginTop: 8,
          paddingVertical: 8,
        },
        container: {
          backgroundColor: SCREEN_BG,
          flex: 1,
        },
        dismiss: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
        },
        groupTitle: {
          color: tokens.color.neutral["500"].value,
          fontSize: 14,
          paddingHorizontal: 16,
          paddingTop: 24,
        },
        header: {
          alignItems: "center",
          backgroundColor: tokens.color.ui.header.value,
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 16,
        },
        headerTitle: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
          fontWeight: "700",
        },
        infoText: {
          color: tokens.color.neutral["600"].value,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        label: { fontSize: 16 },
        linkText: {
          color: tokens.color.text.primary.value,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          textDecorationLine: "underline",
        },
        row: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        separator: {
          backgroundColor: tokens.color.neutral["100"].value,
          height: 1,
          marginHorizontal: 16,
        },
      }),
    [tokens],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      </View>

      {/* --- Display Settings Group --- */}
      <Text style={styles.groupTitle}>▸ Display Settings</Text>
      <View style={styles.card}>
        <Row
          label="Dark Mode"
          value={scheme === "dark"}
          onToggle={toggleScheme}
        />
      </View>

      {/* --- Notifications Group (Placeholder) --- */}
      <Text style={styles.groupTitle}>▸ Notifications</Text>
      <View style={styles.card}>
        <Row
          label="New Draw Alerts"
          value={false}
          onToggle={() => {}}
          disabled
        />
      </View>

      {/* --- Account Group --- */}
      <Text style={styles.groupTitle}>▸ Account</Text>
      <View style={styles.card}>
        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.linkText}>Sign In</Text>
        </Pressable>
      </View>

      {/* --- App Info Group --- */}
      <Text style={styles.groupTitle}>▸ App Info</Text>
      <View style={styles.card}>
        <Text style={styles.infoText}>Version: 1.0.0</Text>
        <Separator />
        <Pressable>
          <Text style={styles.linkText}>Contact Support</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Reusable toggle row
function Row({
  label,
  value,
  onToggle,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { tokens } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { color: tokens.color.text.primary.value, fontSize: 16 },
        row: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
      }),
    [tokens],
  );
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={tokens.color.brand.accent.value}
        disabled={disabled}
      />
    </View>
  );
}

function Separator() {
  const { tokens } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        separator: {
          backgroundColor: tokens.color.neutral["100"].value,
          height: 1,
          marginHorizontal: 16,
        },
      }),
    [tokens],
  );
  return <View style={styles.separator} />;
}
