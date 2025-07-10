import React from "react";
import { View, StyleSheet } from "react-native";

interface BellCurveChartProps {
  counts: number[];
}

export default function BellCurveChart({ counts }: BellCurveChartProps) {
  const max = Math.max(...counts, 0);
  if (!max) return null;
  return (
    <View style={styles.container} accessibilityLabel="Bell curve chart">
      {counts.map((c, idx) => (
        <View
          key={`bar-${idx}`}
          style={[styles.bar, { height: `${(c / max) * 100}%` }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    marginVertical: 16,
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    backgroundColor: "#6c5ce7",
  },
});
