/**
 * When the push address is sent: on sign-in, on every return to the app, and
 * when the phone's address changes. Never while signed out.
 */
import { focusManager } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { useSession } from "@/auth/session-context";

import { onPushTokenChange } from "../notifications";
import { registerThisPhone } from "../registration";
import { usePushRegistration } from "../use-push-registration";

jest.mock("@/auth/session-context", () => ({ useSession: jest.fn() }));
jest.mock("../registration", () => ({
  registerThisPhone: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../notifications", () => ({ onPushTokenChange: jest.fn() }));

const register = jest.mocked(registerThisPhone);
const stopWatchingToken = jest.fn();
let tokenChanged: () => void = () => {};

function signedIn(hasToken: boolean | undefined) {
  jest.mocked(useSession).mockReturnValue({ hasToken, setHasToken: jest.fn() });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(onPushTokenChange).mockImplementation((onChange) => {
    tokenChanged = onChange;
    return stopWatchingToken;
  });
});

afterEach(() => {
  focusManager.setFocused(undefined);
});

test("sends the address once signed in", async () => {
  signedIn(true);

  await renderHook(() => usePushRegistration());

  expect(register).toHaveBeenCalledTimes(1);
});

test.each([false, undefined])(
  "sends nothing when hasToken is %p",
  async (value) => {
    signedIn(value);

    await renderHook(() => usePushRegistration());
    await act(async () => focusManager.setFocused(true));

    expect(register).not.toHaveBeenCalled();
  },
);

test("sends it again on every return to the app, not on leaving", async () => {
  signedIn(true);
  await renderHook(() => usePushRegistration());
  register.mockClear();

  await act(async () => focusManager.setFocused(false));
  expect(register).not.toHaveBeenCalled();

  await act(async () => focusManager.setFocused(true));
  expect(register).toHaveBeenCalledTimes(1);
});

test("sends it again when the phone's address changes", async () => {
  signedIn(true);
  await renderHook(() => usePushRegistration());
  register.mockClear();

  await act(async () => tokenChanged());

  expect(register).toHaveBeenCalledTimes(1);
});

test("stops listening once signed out", async () => {
  signedIn(true);
  const { rerender } = await renderHook(() => usePushRegistration());
  register.mockClear();

  signedIn(false);
  await rerender({});
  await act(async () => focusManager.setFocused(true));

  expect(stopWatchingToken).toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
});
