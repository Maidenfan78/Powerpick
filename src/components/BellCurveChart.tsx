import React, { useMemo } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import * as Svg from "react-native-svg";
import { Bucket } from "../lib/buildSumBuckets";

interface BellCurveChartProps {
  buckets: Bucket[];
  height?: number;
  barColor?: string;
  curveColor?: string;
}

export default function BellCurveChart({
  buckets,
  height = 220,
  barColor = "#6C5CE7",
  curveColor = "#FFEB3B",
}: BellCurveChartProps) {
  const [layout, setLayout] = React.useState<{ w: number; h: number }>();
  const maxFreq = Math.max(...buckets.map((b) => b.freq), 1);

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setLayout({ w: nativeEvent.layout.width, h: height });

  const gaussianPath = useMemo(() => {
    if (!layout || !buckets.length) return "";
    const { w, h } = layout;
    const totalFreq = buckets.reduce((s, b) => s + b.freq, 0);
    const mean =
      buckets.reduce((s, b) => s + b.mid * b.freq, 0) / totalFreq;
    const variance =
      buckets.reduce((s, b) => s + (b.mid - mean) ** 2 * b.freq, 0) /
      totalFreq;
    const sigma = Math.sqrt(variance);

    const xs = Array.from({ length: 100 }, (_, i) => {
      const pos = i / 99;
      return buckets[0].mid + pos * (buckets[buckets.length - 1].mid - buckets[0].mid);
    });
    const norm = (x: number) =>
      (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-((x - mean) ** 2) / (2 * sigma ** 2));

    const ys = xs.map(norm);
    const yMax = Math.max(...ys);

    const scaleX = (x: number) =>
      ((x - buckets[0].mid) /
        (buckets[buckets.length - 1].mid - buckets[0].mid)) *
      w;
    const scaleY = (y: number) => h - (y / yMax) * h;

    let d = `M ${scaleX(xs[0])} ${scaleY(ys[0])}`;
    for (let i = 1; i < xs.length; i++) {
      d += ` L ${scaleX(xs[i])} ${scaleY(ys[i])}`;
    }
    return d;
  }, [layout, buckets]);

  if (!buckets.length) return null;

  return (
    <View style={[styles.wrapper, { height }]} onLayout={onLayout}>
      {buckets.map((b, idx) => (
        <View
          key={idx}
          style={[
            styles.barContainer,
            { width: (layout ? layout.w : buckets.length * 32) / buckets.length, height },
          ]}
        >
          <View
            accessibilityLabel="histogram bar"
            style={{
              backgroundColor: barColor,
              width: "75%",
              height: (b.freq / maxFreq) * (height * 0.9),
            }}
          />
        </View>
      ))}

      {layout && (
        <Svg.Svg
          style={StyleSheet.absoluteFill}
          width={layout.w}
          height={height}
          viewBox={`0 0 ${layout.w} ${height}`}
        >
          <Svg.Path d={gaussianPath} stroke={curveColor} strokeWidth={2} fill="none" />
        </Svg.Svg>
      )}

      <View style={styles.axis}>
        {buckets.map((b) => (
          <Text key={b.label} style={styles.axisLabel}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", paddingBottom: 24 },
  barContainer: { alignItems: "center", justifyContent: "flex-end" },
  axis: { flexDirection: "row", flexWrap: "wrap" },
  axisLabel: {
    fontSize: 10,
    textAlign: "center",
    width: 32,
    color: "#aaa",
  },
});
