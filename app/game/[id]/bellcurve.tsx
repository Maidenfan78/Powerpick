import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/lib/theme";
import { fetchRecentDraws, DrawResult } from "../../../src/lib/gamesApi";
import { useGamesStore } from "../../../src/stores/useGamesStore";
import { SCREEN_BG } from "../../../src/lib/constants";
import BellCurveChart from "../../../src/components/BellCurveChart";

export default function BellCurveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const [counts, setCounts] = useState<number[]>([]);
  const game = useGamesStore((s) => (id ? s.getGame(id) : undefined));

  useEffect(() => {
    const load = async () => {
      if (game) {
        const draws = await fetchRecentDraws(game.id);
        const nums = draws.flatMap((d) => d.winning_numbers);
        const arr = Array(game.mainMax ?? 0).fill(0);
        for (const n of nums) arr[n - 1]++;
        setCounts(arr);
      }
    };
    load();
  }, [game]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: SCREEN_BG,
          flex: 1,
          padding: 16,
        },
        text: { color: tokens.color.neutral["0"].value, fontSize: 16 },
        title: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
          marginBottom: 16,
          textAlign: "center",
        },
      }),
    [tokens]
  );

  if (!game) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{game.name} Bell Curve</Text>
      {counts.length ? (
        <BellCurveChart counts={counts} />
      ) : (
        <Text style={styles.text}>Loading…</Text>
      )}
    </SafeAreaView>
  );
}
