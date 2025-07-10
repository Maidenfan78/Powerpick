import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/lib/theme";
import { fetchRecentDraws, DrawResult } from "../../../src/lib/gamesApi";
import { useGamesStore } from "../../../src/stores/useGamesStore";
import { SCREEN_BG } from "../../../src/lib/constants";

export default function DrawsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const game = useGamesStore((s) => (id ? s.getGame(id) : undefined));

  useEffect(() => {
    const load = async () => {
      if (game) {
        const data = await fetchRecentDraws(game.id);
        setDraws(data);
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
        item: { paddingVertical: 8 },
        text: { color: tokens.color.neutral["0"].value, fontSize: 16 },
        title: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
          marginBottom: 16,
          textAlign: "center",
        },
      }),
    [tokens],
  );

  if (!game) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{game.name} Last 10 Draws</Text>
      <FlatList
        data={draws}
        keyExtractor={(item) => String(item.draw_number)}
        renderItem={({ item }) => {
          const suppText = item.supplementary_numbers?.length
            ? ` - Supp: ${item.supplementary_numbers.join(" - ")}`
            : "";
          const pbText =
            item.powerball !== null && item.powerball !== undefined
              ? ` - Powerball: ${item.powerball}`
              : "";
          return (
            <View style={styles.item}>
              <Text style={styles.text}>
                #{item.draw_number} - {item.draw_date} -{" "}
                {item.winning_numbers.join(" - ")}
                {suppText}
                {pbText}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
