/**
 * The one file that talks to expo-notifications: the channel the server sends
 * to, the push address, and failing soft on a phone that can't do push.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  ATTENDANCE_CHANNEL_ID,
  ensureAttendanceChannel,
  getPermission,
  getPushToken,
  onPushTokenChange,
  STOP_PUSH_TIMEOUT_MS,
  stopPushOnThisPhone,
} from "../notifications";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 6 },
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn(),
  unregisterForNotificationsAsync: jest.fn(),
}));

jest.mock("expo-device", () => ({ isDevice: true }));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "project-1" } } } },
}));

const notifications = jest.mocked(Notifications);

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, "OS", "android");
});

describe("the attendance channel", () => {
  test("is the one the server sends to", async () => {
    await ensureAttendanceChannel();

    expect(ATTENDANCE_CHANNEL_ID).toBe("attendance");
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "attendance",
      expect.objectContaining({ name: "Attendance", importance: 6 }),
    );
  });

  test("uses the phone's own sound, by not naming one", async () => {
    await ensureAttendanceChannel();

    // `sound: "default"` asks for a bundled file called "default" (P-017).
    const [, channel] = notifications.setNotificationChannelAsync.mock.calls[0];
    expect(channel).not.toHaveProperty("sound");
  });

  test("leaves the lock screen to the phone's own setting", async () => {
    await ensureAttendanceChannel();

    const [, channel] = notifications.setNotificationChannelAsync.mock.calls[0];
    expect(channel).not.toHaveProperty("lockscreenVisibility");
  });

  test("isn't made on iOS, which has no channels", async () => {
    jest.replaceProperty(Platform, "OS", "ios");

    await ensureAttendanceChannel();

    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("permission", () => {
  test("never asked on Android 13 reads 'denied', but can still be asked (P-018)", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      status: "denied",
      granted: false,
      canAskAgain: true,
    } as never);

    expect(await getPermission()).toEqual({ granted: false, canAsk: true });
  });

  test("refused twice: Android won't show the prompt again", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      status: "denied",
      granted: false,
      canAskAgain: false,
    } as never);

    expect(await getPermission()).toEqual({ granted: false, canAsk: false });
  });

  test("allowed: nothing left to ask", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      status: "granted",
      granted: true,
      canAskAgain: true,
    } as never);

    expect(await getPermission()).toEqual({ granted: true, canAsk: false });
  });
});

describe("the push address", () => {
  test("is asked for with the app's EAS project", async () => {
    notifications.getExpoPushTokenAsync.mockResolvedValue({
      type: "expo",
      data: "ExponentPushToken[abc]",
    });

    expect(await getPushToken()).toBe("ExponentPushToken[abc]");
    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "project-1",
    });
  });

  test("is null on an emulator", async () => {
    jest.replaceProperty(Device, "isDevice", false);

    expect(await getPushToken()).toBeNull();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test("is null, not a crash, when Expo can't give one", async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error("offline"));

    expect(await getPushToken()).toBeNull();
  });

  test("a change passes on nothing, so the Expo address is asked for again", () => {
    const remove = jest.fn();
    notifications.addPushTokenListener.mockReturnValue({ remove });
    const onChange = jest.fn();

    const stop = onPushTokenChange(onChange);
    const listener = notifications.addPushTokenListener.mock.calls[0][0];
    listener({ type: "android", data: "firebase-token" });

    expect(onChange).toHaveBeenCalledWith();

    stop();
    expect(remove).toHaveBeenCalled();
  });
});

describe("stopping push on this phone", () => {
  test("deletes the channel, which works with no signal, and drops the address", async () => {
    notifications.unregisterForNotificationsAsync.mockResolvedValue(undefined);

    await stopPushOnThisPhone();

    expect(notifications.deleteNotificationChannelAsync).toHaveBeenCalledWith(
      "attendance",
    );
    expect(notifications.unregisterForNotificationsAsync).toHaveBeenCalled();
  });

  test("never fails a sign-out", async () => {
    notifications.deleteNotificationChannelAsync.mockRejectedValueOnce(
      new Error("no channel"),
    );
    notifications.unregisterForNotificationsAsync.mockRejectedValue(
      new Error("unavailable"),
    );

    await expect(stopPushOnThisPhone()).resolves.toBeUndefined();
  });

  test("gives up on Firebase after 3 seconds, so an offline sign-out doesn't hang", async () => {
    jest.useFakeTimers();
    notifications.unregisterForNotificationsAsync.mockReturnValue(
      new Promise(() => {}),
    );

    const stopping = stopPushOnThisPhone();
    await jest.advanceTimersByTimeAsync(STOP_PUSH_TIMEOUT_MS);

    await expect(stopping).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});
