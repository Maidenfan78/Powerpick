/* eslint-disable react-native/no-unused-styles */
import { View, Image, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../lib/theme";

export default function ComingSoon({
  image,
  region,
}: {
  image: number;
  region: string;
}) {
  const { tokens } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          backgroundColor: tokens.color.brand.primary.value,
          flex: 1,
          justifyContent: "center",
        },
        image: { height: 500, resizeMode: "contain", width: 550 },
      }),
    [tokens],
  );
  return (
    <View style={styles.container}>
      <Image
        source={image}
        style={styles.image}
        accessibilityLabel={`${region} coming soon`}
      />
    </View>
  );
}
