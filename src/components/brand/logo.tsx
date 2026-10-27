/**
 * The mark and the wordmark together: "Bantay" in the brand's ink and "Aral"
 * in its green, joined, in Lexend Bold (docs/DESIGN.md, "The logo").
 *
 * One label covers the pair, so a screen reader says "Bantay Aral" once
 * rather than announcing a picture and then the text.
 */
import { Text, View } from "react-native";

import { WORDMARK } from "@/product";
import { strings } from "@/strings";
import { type FontSize, useTheme } from "@/theme";

import { BantayAralMark } from "./bantay-aral-mark";

type LogoProps = {
  /** The mark's size in points. */
  size?: number;
  /** The wordmark's size, from the type scale. */
  wordmarkSize?: FontSize;
};

export function Logo({ size = 40, wordmarkSize = "lg" }: LogoProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.brand.logoLabel}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
      }}
    >
      <BantayAralMark size={size} />
      <Text
        style={{
          fontFamily: theme.fontFamily.headingBold,
          fontSize: theme.fontSize[wordmarkSize],
        }}
      >
        <Text style={{ color: theme.brand.ink }}>{WORDMARK.first}</Text>
        <Text style={{ color: theme.brand.greenText }}>{WORDMARK.second}</Text>
      </Text>
    </View>
  );
}
