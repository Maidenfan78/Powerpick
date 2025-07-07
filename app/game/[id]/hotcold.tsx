/* eslint-disable react-native/no-unused-styles */
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/lib/theme";
import {
  fetchHotColdNumbers,
  fetchRecentDraws,
  HotColdNumbers,
} from "../../../src/lib/gamesApi";
import { calculateHotColdNumbers } from "../../../src/lib/hotCold";
import { useGamesStore } from "../../../src/stores/useGamesStore";
import { SCREEN_BG } from "../../../src/lib/constants";

export default function HotColdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const [numbers, setNumbers] = useState<HotColdNumbers | null>(null);
  const game = useGamesStore((s) => (id ? s.getGame(id) : undefined));

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await fetchHotColdNumbers(id);
        if (
          data.mainHot.length === 0 &&
          data.mainCold.length === 0 &&
          game?.mainMax
        ) {
          try {
            const draws = await fetchRecentDraws(id);
            const mainDraws = draws.map((d) => d.winning_numbers);
            const { hot: mainHot, cold: mainCold } = calculateHotColdNumbers(
              mainDraws,
              game.mainMax,
              20,
            );
            const result: HotColdNumbers = { mainHot, mainCold };
            if (game.suppMax) {
              const supp = draws.flatMap((d) => d.supplementary_numbers ?? []);
              const grouped = supp.map((n) => [n]);
              const { hot, cold } = calculateHotColdNumbers(
                grouped,
                game.suppMax,
                20,
              );
              result.suppHot = hot;
              result.suppCold = cold;
            }
            if (game.powerballMax) {
              const pb = draws
                .map((d) => d.powerball)
                .filter((n): n is number => typeof n === "number")
                .map((n) => [n]);
              const { hot, cold } = calculateHotColdNumbers(
                pb,
                game.powerballMax,
                20,
              );
              result.powerballHot = hot;
              result.powerballCold = cold;
            }
            setNumbers(result);
          } catch (err) {
            console.error("Hot/cold fallback failed", err);
            setNumbers(data);
          }
        } else {
          setNumbers(data);
        }
      }
    };
    load();
  }, [id, game]);

  if (!game) return null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: SCREEN_BG,
          flex: 1,
          padding: 16,
        },
        text: {
          color: tokens.color.neutral["0"].value,
          fontSize: 16,
          marginBottom: 8,
        },
        title: {
          color: tokens.color.neutral["0"].value,
          fontSize: 20,
          marginBottom: 16,
          textAlign: "center",
        },
      }),
    [tokens, game],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{game.name} Hot & Cold Numbers</Text>
      {numbers ? (
        <>
          <Text style={styles.text}>Hot: {numbers.mainHot.join(" - ")}</Text>
          {numbers.suppHot?.length ? (
            <Text style={styles.text}>
              Supp Hot: {numbers.suppHot.join(" - ")}
            </Text>
          ) : null}
          {numbers.powerballHot?.length ? (
            <Text style={styles.text}>
              Powerball Hot: {numbers.powerballHot.join(" - ")}
            </Text>
          ) : null}
          <Text style={styles.text}>Cold: {numbers.mainCold.join(" - ")}</Text>
          {numbers.suppCold?.length ? (
            <Text style={styles.text}>
              Supp Cold: {numbers.suppCold.join(" - ")}
            </Text>
          ) : null}
          {numbers.powerballCold?.length ? (
            <Text style={styles.text}>
              Powerball Cold: {numbers.powerballCold.join(" - ")}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.text}>Loading…</Text>
      )}
    </SafeAreaView>
  );
}
