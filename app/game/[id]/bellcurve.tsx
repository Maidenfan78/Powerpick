import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/lib/theme";
import { fetchRecentDraws } from "../../../src/lib/gamesApi";
import { buildSumBuckets, Bucket } from "../../../src/lib/buildSumBuckets";
import { useGamesStore } from "../../../src/stores/useGamesStore";
import { SCREEN_BG } from "../../../src/lib/constants";
import BellCurveChart from "../../../src/components/BellCurveChart";

export default function BellCurveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const game = useGamesStore((s) => (id ? s.getGame(id) : undefined));

  useEffect(() => {
    const load = async () => {
      if (game) {
        const draws = await fetchRecentDraws(game.id);
        const mainBalls = draws.map((d) => d.winning_numbers);
        setBuckets(buildSumBuckets(mainBalls, 5));
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
      <Text style={styles.title}>{game.name} Sum Frequency Curve</Text>
      {buckets.length ? (
        <BellCurveChart buckets={buckets} />
      ) : (
        <Text style={styles.text}>Loading…</Text>
      )}
    </SafeAreaView>
  );
}
