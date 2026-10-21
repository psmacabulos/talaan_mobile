import type { ExpoConfig } from "expo/config";

/**
 * The app's identity, set in M1 and never changed (CLAUDE.md, "Scope").
 *
 * `com.bantayaral.parent` becomes permanent the day this is published, and M7
 * registers the very same id with Firebase so pushes can find the app.
 * Changing it later silently stops every push on every phone.
 *
 * `scheme` is what a notification tap opens (M7), set now rather than added
 * later when deep links would have to be re-tested.
 *
 * The values below are written out rather than imported from src/. Expo
 * transpiles this file to plain CommonJS and loads it on its own, so a
 * `require("./src/product")` can't resolve a TypeScript file and the config
 * fails to load (docs/PROBLEMS-LOG.md, P-002). app.config.test.ts checks
 * these against src/product.ts and src/theme so the two can't drift apart.
 *
 * The icon and splash artwork are still Expo's placeholders: drawing them
 * from the Bantay Aral mark is M8 (docs/PLAN.md:84).
 */
const APP_ID = "com.bantayaral.parent";
const PRODUCT_NAME = "Bantay Aral";
/** The mark sits on white in both themes — src/theme/colors.ts ICON_BACKGROUND. */
const ICON_BACKGROUND = "#FFFFFF";

const config: ExpoConfig = {
  name: PRODUCT_NAME,
  slug: "bantayaral-parent",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "bantayaral",
  userInterfaceStyle: "automatic",
  // Android first, iOS later from the same code (CLAUDE.md, "Scope"). Web is
  // not a target: react-native-svg's web renderer crashes on the logo, and
  // naming the platforms turns pressing "w" into a clear message instead
  // (docs/PROBLEMS-LOG.md, P-005).
  platforms: ["android", "ios"],
  icon: "./assets/images/icon.png",

  android: {
    package: APP_ID,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: ICON_BACKGROUND,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    // Nothing is requested until a step needs it. M7 adds what push needs.
    permissions: [],
  },

  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: ICON_BACKGROUND,
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },
};

export default config;
