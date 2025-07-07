import React from "react";
import { FlatList, StyleSheet, useWindowDimensions } from "react-native";
import GameCard from "./GameCard";
import { Game } from "../lib/gamesApi";

export function getNumColumns(width: number): number {
  return width <= 768 ? 2 : width <= 1024 ? 3 : 4;
}

type GameGridProps = {
  games: Game[];
  onSelectGame: (game: Game) => void;
};

export default function GameGrid({ games, onSelectGame }: GameGridProps) {
  const { width } = useWindowDimensions();
  const numColumns = getNumColumns(width);

  return (
    <FlatList<Game>
      data={games}
      keyExtractor={(item: Game) => item.id}
      numColumns={numColumns}
      testID="game-grid"
      contentContainerStyle={styles.list}
      renderItem={({ item }: { item: Game }) => (
        <GameCard game={item} onPress={() => onSelectGame(item)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 8,
  },
});
