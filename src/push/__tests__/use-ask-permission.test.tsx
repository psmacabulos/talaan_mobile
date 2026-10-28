/**
 * When Home asks: once there's a child, and Home is the screen in front.
 */
import { renderHook } from "@testing-library/react-native";
import { useIsFocused } from "expo-router";

import { askForPushPermissionOnce } from "../ask-permission";
import { useAskForPushPermission } from "../use-ask-permission";

jest.mock("expo-router", () => ({ useIsFocused: jest.fn() }));
jest.mock("../ask-permission", () => ({
  askForPushPermissionOnce: jest.fn().mockResolvedValue(undefined),
}));

const ask = jest.mocked(askForPushPermissionOnce);
const focused = jest.mocked(useIsFocused);

beforeEach(() => {
  jest.clearAllMocks();
  focused.mockReturnValue(true);
});

test("asks once there's a child", async () => {
  await renderHook(() => useAskForPushPermission(true));

  expect(ask).toHaveBeenCalledTimes(1);
});

test("doesn't ask a parent with no children yet", async () => {
  await renderHook(() => useAskForPushPermission(false));

  expect(ask).not.toHaveBeenCalled();
});

test("waits until Home is the screen in front", async () => {
  focused.mockReturnValue(false);
  const { rerender } = await renderHook(() => useAskForPushPermission(true));
  expect(ask).not.toHaveBeenCalled();

  focused.mockReturnValue(true);
  await rerender({});

  expect(ask).toHaveBeenCalledTimes(1);
});
