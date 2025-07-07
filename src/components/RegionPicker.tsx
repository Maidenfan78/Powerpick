/* ---------- RegionPicker.tsx ---------- */
/* eslint-disable react-native/no-unused-styles */
import React, { useState, useMemo } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

import { useTheme } from "../lib/theme";
import { useRegionStore, Region } from "../stores/useRegionStore";
import { REGION_LABELS } from "../lib/regionConfig";

const BACKDROP_COLOR = "rgba(0,0,0,0.4)";

const REGION_OPTIONS: Region[] = ["AU", "US", "EU"];

export default function RegionPicker({
  variant = "default",
}: {
  variant?: "default" | "header";
}) {
  const { tokens } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const region = useRegionStore((s) => s.region);
  const setRegion = useRegionStore((s) => s.setRegion);
  const [visible, setVisible] = useState(false);

  const labelFor = (r: Region) => REGION_LABELS[r];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          alignItems: "center",
          backgroundColor: BACKDROP_COLOR,
          flex: 1,
          justifyContent: "center",
        },
        button: {
          alignItems: "center",
          backgroundColor:
            variant === "header"
              ? tokens.color.ui.menu.value
              : tokens.color.neutral["0"].value,
          borderRadius: 8,
          flexDirection: "row",
          height: variant === "header" ? 36 : undefined,
          justifyContent: "space-between",
          margin: variant === "header" ? 0 : 16,
          paddingHorizontal: 12,
          paddingVertical: variant === "header" ? 0 : 12,
          width: variant === "header" ? 140 : undefined,
        },
        buttonText: {
          color:
            variant === "header"
              ? tokens.color.text.primary.value
              : tokens.color.brand.primary.value,
          fontSize: 14,
          fontWeight: "500",
        },
        checkIcon: {
          color: tokens.color.brand.accent.value,
          fontSize: 18,
          marginLeft: 8,
        },
        icon: {
          color:
            variant === "header"
              ? tokens.color.text.primary.value
              : tokens.color.brand.accent.value,
          fontSize: 16,
          marginLeft: 8,
        },
        modal: {
          backgroundColor: tokens.color.neutral["0"].value,
          borderRadius: 12,
          minWidth: "60%",
          padding: 16,
        },
        optionText: {
          color: tokens.color.brand.primary.value,
          fontSize: 16,
        },
        row: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
        },
      }),
    [tokens, variant],
  );

  return (
    <>
      <Pressable style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.buttonText}>{labelFor(region)}</Text>
        {/* down-pointing triangle as ChevronDown */}
        <Text style={styles.icon}>▼</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.modal} pointerEvents="box-none">
            {REGION_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={styles.row}
                onPress={(e) => {
                  e.stopPropagation();
                  setRegion(opt);
                  setVisible(false);
                  if (pathname !== "/") router.navigate("/");
                }}
              >
                <Text style={styles.optionText}>{labelFor(opt)}</Text>
                {/* check mark if selected */}
                {opt === region && <Text style={styles.checkIcon}>✔</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
