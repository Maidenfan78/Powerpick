import React, { useMemo } from "react";
import { View, Image, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RegionPicker from "./RegionPicker";
import logoImg from "../../assets/logo.png";
import { useTheme } from "../lib/theme";

export default function HomeTopBar() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          backgroundColor: tokens.color.ui.header.value,
          flexDirection: "row",
          height: 56 + insets.top,
          justifyContent: "space-between",
          paddingHorizontal: 8,
          paddingTop: insets.top,
        },
        logo: {
          height: 32,
          resizeMode: "contain",
          width: 120,
        },
        menuIcon: {
          color: tokens.color.text.primary.value,
          fontSize: 24,
        },
      }),
    [insets.top, tokens],
  );

  return (
    <View style={styles.container}>
      <Image source={logoImg} style={styles.logo} />
      <RegionPicker variant="header" />
      <Pressable accessibilityLabel="Menu">
        <Text style={styles.menuIcon}>⋮</Text>
      </Pressable>
    </View>
  );
}
