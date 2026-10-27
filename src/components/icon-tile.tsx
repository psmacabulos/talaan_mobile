/**
 * A small rounded square holding one icon: the coloured tiles beside a
 * child's times on Home, and later beside each notification.
 *
 * One component so every tile in the app is the same size, corner and
 * contrast. The tile takes a status colour's `text` as its fill and the card
 * colour for the icon: a saturated tile with a white icon in light mode, a
 * light tile with a dark icon in dark mode, both well past 3:1
 * (src/theme/contrast.test.ts).
 */
import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/theme";

const TILE_SIZE = 40;

export function IconTile({
  background,
  children,
  testID,
}: {
  background: string;
  /** The icon, drawn in `theme.colors.card`. */
  children: ReactNode;
  testID?: string;
}) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        alignItems: "center",
        backgroundColor: background,
        borderRadius: theme.radius.md,
        height: TILE_SIZE,
        justifyContent: "center",
        width: TILE_SIZE,
      }}
    >
      {children}
    </View>
  );
}
