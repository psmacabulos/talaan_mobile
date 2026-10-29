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
 * The icon and splash are the Bantay Aral mark, copied from design/logo/ in
 * M8 (design/logo/README.md, "App icon and splash").
 */
const APP_ID = "com.bantayaral.parent";
const PRODUCT_NAME = "Bantay Aral";
/** The mark sits on white in both themes — src/theme/colors.ts ICON_BACKGROUND. */
const ICON_BACKGROUND = "#FFFFFF";
/**
 * The circle behind the push icon (on older Android, the app's name too): the
 * mark's deep blue, src/theme/colors.ts brand.light.parent.
 */
const NOTIFICATION_COLOR = "#1149A6";
/**
 * The owner's EAS project, from `npx eas init` (docs/PUSH.md, Part A). Expo's
 * push service needs it to hand out a push token. Not a secret.
 */
const EAS_PROJECT_ID = "c5d60aa1-0647-4286-a029-161cd424ee2d";
/** The Expo account that owns that project. EAS checks the two match. */
const EAS_OWNER = "pmacabulos";
/**
 * Which Firebase project the app belongs to, so the phone can get a push
 * token. `.gitignore` keeps the file off GitHub and so out of what EAS uploads:
 * on the build server it arrives as the EAS file variable
 * `GOOGLE_SERVICES_JSON` (docs/PUSH.md, Part D), and on this laptop it's the
 * file in the project root.
 */
const GOOGLE_SERVICES_FILE =
  process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";

const config: ExpoConfig = {
  name: PRODUCT_NAME,
  slug: "bantayaral-parent",
  owner: EAS_OWNER,
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
    googleServicesFile: GOOGLE_SERVICES_FILE,
    adaptiveIcon: {
      backgroundColor: ICON_BACKGROUND,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    // Nothing extra is requested. expo-notifications brings its own
    // POST_NOTIFICATIONS and RECEIVE_BOOT_COMPLETED, which the build merges in.
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
      // The mark with the adaptive icon's padding (the same picture as
      // android-icon-foreground.png): Android 12 and newer show the splash
      // inside a circle, which would cut the corners off a mark that fills
      // its square.
      {
        backgroundColor: ICON_BACKGROUND,
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
      },
    ],
    // Android draws a push's icon in one colour, from its shape alone, so the
    // icon is the mark as a white outline. No large icon: it would show the
    // mark a second time (docs/PUSH.md, "What a push looks like").
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: NOTIFICATION_COLOR,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
};

export default config;
