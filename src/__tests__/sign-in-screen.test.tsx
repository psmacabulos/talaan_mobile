/**
 * A smoke test for the sign-in screen's look: it renders, the logo carries
 * one label a screen reader can read, and the fields are reachable by their
 * labels. M3 adds tests for signing in itself.
 *
 * It lives here, not beside the screen: Expo Router turns EVERY file under
 * src/app into a route, test files included, which would ship the testing
 * library inside the app. Colocate tests anywhere except src/app.
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 * Without the await it returns a pending promise, which shows up as
 * "getByText is not a function", or as `screen` insisting nothing was
 * rendered — neither of which points at the real cause.
 */
import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { strings } from "@/strings";

import SignInScreen from "@/app/index";

/** SafeAreaProvider has no real insets in a test, so they're supplied here. */
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SignInScreen />
    </SafeAreaProvider>,
  );
}

describe("the sign-in screen", () => {
  test("shows the heading and what the app is for", async () => {
    await renderScreen();

    expect(screen.getByText(strings.signIn.heading)).toBeTruthy();
    expect(screen.getByText(strings.signIn.subheading)).toBeTruthy();
  });

  test("the logo reads as one thing, not a picture plus text", async () => {
    await renderScreen();

    expect(screen.getByLabelText(strings.brand.logoLabel)).toBeTruthy();
  });

  test("both fields are reachable by their labels", async () => {
    await renderScreen();

    expect(screen.getByLabelText(strings.signIn.emailLabel)).toBeTruthy();
    expect(screen.getByLabelText(strings.signIn.passwordLabel)).toBeTruthy();
  });
});
