/**
 * The frame the forms sit in, and the one thing it exists for: when the
 * keyboard opens, the form makes room for it rather than hiding under it
 * (docs/PROBLEMS-LOG.md, P-021).
 *
 * The keyboard is played by the event React Native sends when it opens. On
 * Android that's keyboardDidShow; the tests run as iOS, which sends
 * keyboardWillShow. Either way it's the same KeyboardAvoidingView reacting.
 */
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { DeviceEventEmitter, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FormScreen } from "../form-screen";

const SCREEN_HEIGHT = 800;
const KEYBOARD_HEIGHT = 300;

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: SCREEN_HEIGHT },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderForm() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <FormScreen>
        <Text>Password</Text>
      </FormScreen>
    </SafeAreaProvider>,
  );

  // Where the frame sits on the screen, which a test has no layout to tell it.
  await fireEvent(screen.getByTestId("form-screen"), "layout", {
    persist: () => {},
    nativeEvent: {
      layout: { x: 0, y: 0, width: 360, height: SCREEN_HEIGHT },
    },
  });
}

async function keyboard(
  event: "keyboardWillShow" | "keyboardWillHide",
  height: number,
) {
  await act(async () => {
    DeviceEventEmitter.emit(event, {
      duration: 0,
      easing: "keyboard",
      endCoordinates: {
        screenX: 0,
        screenY: SCREEN_HEIGHT - height,
        width: 360,
        height,
      },
    });
  });
}

test("shows what it's given", async () => {
  await renderForm();

  expect(screen.getByText("Password")).toBeOnTheScreen();
});

test("makes room for the keyboard when it opens, and gives it back when it closes", async () => {
  await renderForm();
  const frame = screen.getByTestId("form-screen");

  await keyboard("keyboardWillShow", KEYBOARD_HEIGHT);
  expect(frame).toHaveStyle({ paddingBottom: KEYBOARD_HEIGHT });

  await keyboard("keyboardWillHide", 0);
  expect(frame).toHaveStyle({ paddingBottom: 0 });
});
