/**
 * The only file that talks to `expo-notifications`, so changing how push
 * reaches the phone means changing this file and nothing else (CLAUDE.md,
 * "Cheap to run, easy to move").
 *
 * Every function here fails soft. A phone that can't do push (an emulator, a
 * phone without Google Play Services, Expo Go) gets `null` or nothing, never a
 * crash: push is something the app adds to, not something it needs to open.
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

import { settleWithin } from "@/lib/settle-within";
import { strings } from "@/strings";

/**
 * The server sends every push to this channel (docs/TALAAN-API.md:223), and
 * Android doesn't show a push sent to a channel the phone doesn't have.
 */
export const ATTENDANCE_CHANNEL_ID = "attendance";

export type PushPlatform = "android" | "ios";
/**
 * Whether pushes may show, and whether the system prompt may still be shown.
 *
 * Not Expo's `status`: on Android 13 and newer a permission that was never
 * asked reads `"denied"`, the same as one refused, and only `canAskAgain`
 * tells them apart (docs/PROBLEMS-LOG.md, P-018). Android itself stops showing
 * the prompt after a parent refuses twice, which is when `canAsk` turns false.
 */
export type Permission = { granted: boolean; canAsk: boolean };

/**
 * Create the channel, or leave it as it is. Safe to call on every run.
 *
 * Android fixes a channel's importance, sound and lock-screen visibility the
 * first time it is created; changing them later means a new channel id. Lock-screen
 * visibility is deliberately not set, so each phone's own setting decides
 * (owner decision, 2026-10-28): the push holds only a first name and a time.
 */
export async function ensureAttendanceChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ATTENDANCE_CHANNEL_ID, {
    name: strings.push.channelName,
    importance: AndroidImportance.HIGH,
    // No `sound`: leaving it out is what gives the phone's own notification
    // sound. `sound: "default"` means a bundled file called "default", which
    // doesn't exist, and Android never lets a channel's sound change after
    // (docs/PROBLEMS-LOG.md, P-017).
  });
}

export async function getPermission(): Promise<Permission> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted, canAsk: !granted && canAskAgain };
}

/** Shows the system's "Allow notifications?" prompt. True when allowed. */
export async function askPermission(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/**
 * This phone's Expo push address, `ExponentPushToken[…]`, or `null` when it
 * can't have one. Never logged: it's what a stranger would need to send this
 * parent a notification.
 */
export async function getPushToken(): Promise<string | null> {
  const id = projectId();

  if (!Device.isDevice || id === null) {
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: id,
    });
    return data;
  } catch {
    // Offline, no Play Services, or Expo Go. The next run tries again.
    return null;
  }
}

export function pushPlatform(): PushPlatform | null {
  return Platform.OS === "android" || Platform.OS === "ios"
    ? Platform.OS
    : null;
}

/**
 * Calls `onChange` when the phone's push address changes.
 *
 * The listener is handed the phone's **Firebase** token, not the Expo one the
 * server wants, so it is deliberately not passed on: the caller asks for the
 * Expo address again.
 */
export function onPushTokenChange(onChange: () => void): () => void {
  const subscription = Notifications.addPushTokenListener(() => onChange());
  return () => subscription.remove();
}

/** Sign-out never waits longer than this on anything push-related. */
export const STOP_PUSH_TIMEOUT_MS = 3_000;

/**
 * Stop this phone showing pushes, whatever the server still holds.
 *
 * Signing out asks the server to forget this phone's address, but a sign-out
 * with no signal never reaches it, and the address would live on for up to 30
 * days, showing children's names on a phone nobody is signed in to
 * (docs/PROBLEMS-LOG.md, P-016). Two locks:
 *
 * - **The channel is deleted.** Works offline and at once: Expo doesn't show a
 *   push sent to a channel the phone doesn't have. The next sign-in makes it
 *   again.
 * - **The Firebase token is dropped,** which kills the address itself. That
 *   needs the internet, so it's given a few seconds and no more: a parent
 *   signing out in a dead spot isn't kept waiting.
 */
export async function stopPushOnThisPhone(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      await Notifications.deleteNotificationChannelAsync(ATTENDANCE_CHANNEL_ID);
    } catch {
      // A phone that never made the channel has nothing to delete.
    }
  }

  await settleWithin(
    Notifications.unregisterForNotificationsAsync(),
    STOP_PUSH_TIMEOUT_MS,
  );
}

/** `extra` is loosely typed by Expo, so the value is checked, not trusted. */
function projectId(): string | null {
  const fromConfig: unknown = Constants.expoConfig?.extra?.eas?.projectId;

  if (typeof fromConfig === "string") {
    return fromConfig;
  }

  return Constants.easConfig?.projectId ?? null;
}
