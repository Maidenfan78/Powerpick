import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Platform,
  Share,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../../src/lib/theme";
import { generateSet } from "../../../src/lib/generator";
import { useGeneratedNumbersStore } from "../../../src/stores/useGeneratedNumbersStore";
import type { GameConfig } from "../../../src/lib/gameConfigs";
import { useGamesStore } from "../../../src/stores/useGamesStore";
import { getGameColor } from "../../../src/lib/gameColors";
import { SCREEN_BG, CARD_BG } from "../../../src/lib/constants";
import * as FileSystem from "expo-file-system";

export default function GameOptionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const router = useRouter();

  const [sets, setSets] = useState<number[][]>([]);
  const [setCount, setSetCount] = useState(1);
  const [isAuto, setIsAuto] = useState(true);
  const [hotRatio, setHotRatio] = useState(50);
  const [hotPercent, setHotPercent] = useState(50);

  const saveNumbers = useGeneratedNumbersStore((s) => s.saveNumbers);
  const game = useGamesStore((s) => (id ? s.getGame(id) : undefined));

  // Build config from store if available
  const config: GameConfig | undefined =
    game && game.mainMax && game.mainCount
      ? {
          mainMax: game.mainMax,
          mainCount: game.mainCount,
          suppCount: game.suppCount ?? undefined,
          suppMax: game.suppMax ?? undefined,
          powerballMax: game.powerballMax ?? undefined,
        }
      : undefined;

  // Human-readable description of the pick
  const descParts: string[] = [];
  if (config) {
    descParts.push(`${config.mainCount} main`);
    if (config.suppCount) descParts.push(`${config.suppCount} supp`);
    if (config.powerballMax) descParts.push("Powerball");
  }
  const description = descParts.join(" + ");

  // Fallback for missing config
  const displayCfg: GameConfig = config ?? {
    mainMax: 50,
    mainCount: 6,
    suppMax: undefined,
    suppCount: undefined,
    powerballMax: undefined,
  };

  // Helpers to slice a generated set into display parts
  const sliceNumbers = (nums: number[]) => {
    const main = nums.slice(0, displayCfg.mainCount);
    const supp =
      displayCfg.suppCount !== undefined
        ? nums.slice(
            displayCfg.mainCount,
            displayCfg.mainCount + displayCfg.suppCount,
          )
        : [];
    const pb =
      displayCfg.powerballMax !== undefined ? nums[nums.length - 1] : undefined;
    return { main, supp, pb };
  };

  // Generate a fresh set of numbers
  const handleGenerate = () => {
    const newSets: number[][] = [];
    for (let i = 0; i < setCount; i++) {
      const nums: number[] = [];

      // Main balls
      nums.push(
        ...generateSet({
          maxNumber: displayCfg.mainMax,
          pickCount: displayCfg.mainCount,
        }),
      );

      // Supplementary balls
      if (
        displayCfg.suppMax !== undefined &&
        displayCfg.suppCount !== undefined
      ) {
        nums.push(
          ...generateSet({
            maxNumber: displayCfg.suppMax,
            pickCount: displayCfg.suppCount,
          }),
        );
      }

      // Powerball (or equivalent)
      if (displayCfg.powerballMax !== undefined) {
        nums.push(
          ...generateSet({
            maxNumber: displayCfg.powerballMax,
            pickCount: 1,
          }),
        );
      }

      newSets.push(nums);
      if (id) saveNumbers(id, nums);
    }

    setSets(newSets);
  };

  const handleDownload = async (format: "csv" | "txt" | "xlsx") => {
    const extension = format;
    const content =
      format === "txt"
        ? sets.map((s) => s.join(" ")).join("\n")
        : sets.map((s) => s.join(",")).join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `numbers.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileUri = `${FileSystem.cacheDirectory}numbers.${extension}`;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Share.share({ url: fileUri });
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          alignItems: "center",
          backgroundColor: CARD_BG,
          borderRadius: 8,
          padding: 12,
        },
        buttonSpacing: { marginTop: 12 },
        buttonText: { color: tokens.color.neutral["0"].value, fontSize: 18 },
        close: { color: tokens.color.neutral["0"].value, fontSize: 20 },
        configText: {
          color: tokens.color.neutral["0"].value,
          fontSize: 16,
          marginBottom: 16,
          textAlign: "center",
        },
        container: {
          backgroundColor: SCREEN_BG,
          flex: 1,
          padding: 16,
        },
        disabled: { opacity: 0.5 },
        header: {
          backgroundColor: game
            ? getGameColor(game.name)
            : tokens.color.brand.primary.value,
          borderRadius: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: 8,
        },
        numbers: {
          color: tokens.color.neutral["0"].value,
          fontSize: 24,
          marginVertical: 16,
          textAlign: "center",
        },
        scrollContent: { paddingBottom: 16 },
        setLabel: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
          marginTop: 12,
          textAlign: "center",
        },
        sliderContainer: { marginBottom: 16 },
        sliderLabel: { color: tokens.color.neutral["0"].value },
        title: { color: tokens.color.neutral["0"].value, fontSize: 20 },
        toggleRow: {
          alignItems: "center",
          flexDirection: "row",
          marginBottom: 16,
        },
        toggleText: { color: tokens.color.neutral["0"].value, marginLeft: 8 },
      }),
    [tokens, game],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{game ? game.name : "Game Options"}</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {description !== "" && (
          <Text style={styles.configText}>Pick {description}</Text>
        )}

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Sets to Generate: {setCount}</Text>
          <Slider
            value={setCount}
            minimumValue={1}
            maximumValue={50}
            step={1}
            onValueChange={setSetCount}
            accessibilityLabel="Set count"
          />
        </View>

        <View accessibilityLabel="Auto toggle" style={styles.toggleRow}>
          <Switch
            value={isAuto}
            onValueChange={setIsAuto}
            accessibilityRole="switch"
          />
          <Text style={styles.toggleText}>Auto</Text>
        </View>

        <View
          pointerEvents={isAuto ? "none" : "auto"}
          style={[styles.sliderContainer, isAuto && styles.disabled]}
        >
          <Text style={styles.sliderLabel}>Hot vs Cold: {hotRatio}% Hot</Text>
          <Slider
            value={hotRatio}
            minimumValue={0}
            maximumValue={100}
            step={1}
            onValueChange={setHotRatio}
            disabled={isAuto}
            accessibilityLabel="Hot cold ratio"
          />
          <Text style={styles.sliderLabel}>
            Hot/Cold Numbers Used: {hotPercent}%
          </Text>
          <Slider
            value={hotPercent}
            minimumValue={0}
            maximumValue={100}
            step={1}
            onValueChange={setHotPercent}
            disabled={isAuto}
            accessibilityLabel="Hot cold percent"
          />
        </View>

        <Pressable
          style={styles.button}
          onPress={handleGenerate}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Generate Numbers</Text>
        </Pressable>

        {sets.length > 0 && (
          <>
            <Pressable
              style={[styles.button, styles.buttonSpacing]}
              onPress={() => handleDownload("csv")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Download CSV</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSpacing]}
              onPress={() => handleDownload("txt")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Download TXT</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSpacing]}
              onPress={() => handleDownload("xlsx")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Download XLSX</Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={[styles.button, styles.buttonSpacing]}
          onPress={() => router.push(`/game/${id}/draws`)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Last 10 Draws</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSpacing]}
          onPress={() => router.push(`/game/${id}/hotcold`)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Hot & Cold Numbers</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSpacing]}
          onPress={() => router.push(`/game/${id}/bellcurve`)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Bell Curve</Text>
        </Pressable>

        {sets.length > 0 && (
          <>
            {sets.map((nums, idx) => {
              const { main, supp, pb } = sliceNumbers(nums);
              return (
                <View key={`set-${idx}`}>
                  {sets.length > 1 && (
                    <Text style={styles.setLabel}>Set {idx + 1}</Text>
                  )}
                  <Text style={styles.numbers}>Main: {main.join(" - ")}</Text>
                  {supp.length > 0 && (
                    <Text style={styles.numbers}>Supp: {supp.join(" - ")}</Text>
                  )}
                  {pb !== undefined && (
                    <Text style={styles.numbers}>Powerball: {pb}</Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
