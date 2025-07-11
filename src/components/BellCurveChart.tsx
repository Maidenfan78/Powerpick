import React from "react";
import { View, StyleSheet, Text, LayoutChangeEvent } from "react-native";
import * as Svg from "react-native-svg";

interface BellCurveChartProps {
  counts: number[];
}

function buildPath(
  values: number[],
  width: number,
  height: number,
): string {
  const max = Math.max(...values);
  const step = width / values.length;
  const points = values.map((v, i) => {
    return {
      x: i * step + step / 2,
      y: height - (v / max) * height,
    };
  });
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function BellCurveChart({ counts }: BellCurveChartProps) {
  const max = Math.max(...counts, 0);
  const [layout, setLayout] = React.useState<{ width: number; height: number }>();

  if (!max) return null;
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  const path =
    layout && counts.length > 1
      ? buildPath(counts, layout.width, layout.height)
      : "";

  return (
    <View accessibilityLabel="Bell curve chart" style={styles.wrapper}>
      <View style={styles.chartArea} onLayout={onLayout}>
        {counts.map((c, idx) => (
          <View key={`bar-${idx}`} style={styles.barContainer}>
            <Text style={styles.countLabel}>{c}</Text>
            <View
              accessibilityLabel="count bar"
              style={[styles.bar, { height: `${(c / max) * 100}%` }]}
            />
          </View>
        ))}
        {layout && path ? (
          <Svg.Svg
            style={StyleSheet.absoluteFill}
            width={layout.width}
            height={layout.height}
          >
            <Svg.Path d={path} stroke="#6c5ce7" fill="none" />
          </Svg.Svg>
        ) : null}
      </View>
      <View style={styles.axis}>
        {counts.map((_, idx) => (
          <Text key={`axis-${idx}`} style={styles.axisLabel}>
            {idx + 1}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 16,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: "60%",
    marginHorizontal: 1,
    backgroundColor: "#6c5ce7",
  },
  countLabel: {
    fontSize: 10,
    marginBottom: 2,
    color: "#333",
  },
  axis: {
    flexDirection: "row",
  },
  axisLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#666",
  },
});
