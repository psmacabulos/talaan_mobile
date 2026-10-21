/**
 * app.config.ts has to write its values out rather than import them, because
 * Expo loads it as standalone CommonJS (docs/PROBLEMS-LOG.md, P-002). These
 * tests are what stops the two copies drifting apart.
 *
 * The package id matters most: it is permanent once published, and M7
 * registers it with Firebase. If it ever stopped matching src/product.ts,
 * push would fail on every phone with no obvious cause.
 */
import appConfig from "./app.config";
import { APP_ID, PRODUCT_NAME } from "./src/product";
import { ICON_BACKGROUND } from "./src/theme/colors";

describe("the app's identity", () => {
  test("the name on the phone is the product name", () => {
    expect(appConfig.name).toBe(PRODUCT_NAME);
  });

  test("Android and iOS carry the id push is registered against", () => {
    expect(appConfig.android?.package).toBe(APP_ID);
    expect(appConfig.ios?.bundleIdentifier).toBe(APP_ID);
  });

  test("a notification tap has a scheme to open (M7)", () => {
    expect(appConfig.scheme).toBe("bantayaral");
  });

  test("web is not a target", () => {
    expect(appConfig.platforms).toEqual(["android", "ios"]);
  });

  test("light and dark follow the phone", () => {
    expect(appConfig.userInterfaceStyle).toBe("automatic");
  });

  test("nothing is requested from the phone until a step needs it", () => {
    expect(appConfig.android?.permissions).toEqual([]);
  });

  test("the icon sits on the theme's icon background", () => {
    expect(appConfig.android?.adaptiveIcon?.backgroundColor).toBe(
      ICON_BACKGROUND,
    );
  });

  test("the splash sits on the same background as the icon", () => {
    const splash = appConfig.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );
    expect(Array.isArray(splash) && splash[1].backgroundColor).toBe(
      ICON_BACKGROUND,
    );
  });
});
