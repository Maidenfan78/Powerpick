import { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import RegionPicker from "../src/components/RegionPicker";
import ComingSoon from "../src/components/ComingSoon";
import GameGrid from "../src/components/GameGrid";
import { SCREEN_BG } from "../src/lib/constants";
import { useTheme } from "../src/lib/theme";
import { Game, fetchGames } from "../src/lib/gamesApi";
import { useRouter } from "expo-router";
import { useGamesStore } from "../src/stores/useGamesStore";
import { useRegionStore } from "../src/stores/useRegionStore";
import {
  REGION_PLACEHOLDER_IMAGES,
  REGION_LABELS,
} from "../src/lib/regionConfig";

export default function IndexScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const region = useRegionStore((s) => s.region);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setGamesStore = useGamesStore((s) => s.setGames);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await fetchGames();
        setGames(data);
        setGamesStore(data);
      } catch (err) {
        console.error("Unexpected fetch error:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [setGamesStore]);

  const handleSelectGame = (game: Game) => {
    router.push(`/game/${game.id}/options`);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: SCREEN_BG, flex: 1 },
        debugText: { color: tokens.color.text.primary.value, fontSize: 18 },
        errorText: { color: tokens.color.text.error.value, fontSize: 18 },
        gridContainer: { flex: 1, paddingVertical: 8 },
        pickerContainer: { padding: 8 },
      }),
    [tokens],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.pickerContainer}>
        <RegionPicker variant="header" />
      </View>
      {region === "AU" ? (
        <View style={styles.gridContainer}>
          {error ? (
            <Text style={styles.errorText}>❌ {error}</Text>
          ) : loading ? (
            <Text style={styles.debugText}>Loading games…</Text>
          ) : (
            <GameGrid games={games} onSelectGame={handleSelectGame} />
          )}
        </View>
      ) : (
        <ComingSoon
          image={REGION_PLACEHOLDER_IMAGES[region] as number}
          region={REGION_LABELS[region]}
        />
      )}
    </SafeAreaView>
  );
}
