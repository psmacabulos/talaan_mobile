/**
 * The top of Home, from the owner's design (design/BantayAral Children
 * Dashboard Comparison.png): the logo, "My children" with one line under it,
 * and the school behind them as a background.
 *
 * The school sits in the corner the logo and the heading leave empty, its
 * base level with the heading's, so it rises behind the right of the logo
 * row. The words are drawn over it but never on it: at 360 points wide the
 * logo ends at about 222 and the picture's left edge is at 208, where it's
 * still transparent sky. The heading keeps clear of it, and wraps rather than
 * reach it. The line under the heading runs below the picture, the full
 * width, so it fits on one line (288 of 328 points).
 *
 * It says nothing a parent needs, so a screen reader skips it, and at large
 * text sizes it goes altogether: the heading needs the width more than the
 * screen needs the school.
 *
 * The file is 3 times the size it's drawn at, for the sharpest screens, and
 * no bigger (CLAUDE.md, "Images are sized for how they're shown").
 */
import { Image } from "expo-image";
import { Text, View } from "react-native";

import { Logo } from "@/components/brand/logo";
import { useLargeText } from "@/lib/use-large-text";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

/** Bigger than the sign-in screen's: Home is where the brand lives. */
const LOGO_SIZE = 52;

/** 360 × 240 pixels in the file. */
const ILLUSTRATION = { width: 120, height: 80 };
const SCHOOL = require("../../../assets/images/illustration-school.png");

export function HomeHeader() {
  const theme = useTheme();
  const largeText = useLargeText();

  return (
    <View style={{ gap: theme.space.xs }}>
      <View style={{ gap: theme.space.md }}>
        {/* First, so everything after it is drawn on top. */}
        {largeText ? null : (
          <View
            testID="home-illustration"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ bottom: 0, position: "absolute", right: 0 }}
          >
            <Image source={SCHOOL} contentFit="contain" style={ILLUSTRATION} />
          </View>
        )}

        {/* "BantayAral" is one word and can't wrap: at large text sizes the
            usual wordmark size keeps it on a 360-point screen. */}
        <Logo size={LOGO_SIZE} wordmarkSize={largeText ? "lg" : "xl"} />

        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.xl,
            // Text a little larger than normal wraps here rather than running
            // onto the trees.
            paddingRight: largeText ? 0 : ILLUSTRATION.width + theme.space.sm,
          }}
        >
          {strings.home.heading}
        </Text>
      </View>

      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {strings.home.subheading}
      </Text>
    </View>
  );
}
