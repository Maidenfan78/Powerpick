// components/GameCard.tsx
/* eslint-disable react-native/no-unused-styles, react-native/sort-styles */
import React, { useState, useMemo, useEffect } from "react";
import {
  Text,
  Image,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import type { Game } from "../lib/gamesApi";
import placeholder from "../../assets/placeholder.png";
import { getGameColor } from "../lib/gameColors";
import { useTheme } from "../lib/theme";

type GameCardProps = {
  game: Game;
  onPress: (e: GestureResponderEvent) => void;
};

export default function GameCard({ game, onPress }: GameCardProps) {
  const { tokens } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignItems: "center",
          backgroundColor: tokens.color.ui.card.value,
          borderRadius: 8,
          flex: 1,
          margin: 4,
          paddingHorizontal: 12,
          paddingVertical: 16,
        },
        jackpot: {
          color: tokens.color.text.primary.value,
          fontSize: 18,
          fontWeight: "700",
        },
        logo: {
          backgroundColor: getGameColor(game.name),
          borderRadius: 64,
          height: 96,
          marginBottom: 10,
          width: 96,
        },
        nextDraw: {
          textAlign: "center",
          color: tokens.color.text.primary.value,
          fontSize: 14,
          marginTop: 4,
        },
      }),
    [game.name, tokens],
  );

  const [loading, setLoading] = useState(!!game.logoUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!game.logoUrl) {
      setLoading(false);
    }
  }, [game.logoUrl]);

  const imageSource =
    error || !game.logoUrl ? { uri: "" } : { uri: game.logoUrl };

  return (
    <Pressable
      style={styles.card as StyleProp<ViewStyle>}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${game.name} options`}
    >
      {loading && <ActivityIndicator style={styles.logo} />}
      {error || !game.logoUrl ? (
        <Image source={placeholder} style={styles.logo} resizeMode="contain" />
      ) : (
        <Image
          source={imageSource}
          style={styles.logo}
          resizeMode="center"
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      <Text style={styles.jackpot}>{game.jackpot}</Text>
      {game.nextDrawTime && (
        <Text style={styles.nextDraw}>
          {new Date(game.nextDrawTime).toLocaleString()}
        </Text>
      )}
    </Pressable>
  );
}
