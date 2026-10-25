/**
 * A grey block standing in for content that hasn't arrived.
 *
 * Deliberately **still**. A shimmer is the fashion, but CLAUDE.md requires
 * motion to stop when the phone asks for reduced motion, and a skeleton is
 * the one place where an animation runs on every single load. A plain block
 * says the same thing and asks nothing of anyone.
 */
import { View, type DimensionValue } from "react-native";

import { useTheme } from "@/theme";

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
};

export function Skeleton({ width = "100%", height, radius }: SkeletonProps) {
  const theme = useTheme();

  return (
    <View
      // Nothing here to announce: a screen reader should hear the real
      // content when it arrives, not a description of a placeholder.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: theme.colors.skeleton,
        borderRadius: radius ?? theme.radius.sm,
        height,
        width,
      }}
    />
  );
}
