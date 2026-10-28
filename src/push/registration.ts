/**
 * Send this phone's push address to the server: channel first, then
 * permission, then the address (docs/TALAAN-API.md:223 wants the channel to
 * exist before the address is registered).
 *
 * Two places start a run, the app shell and Home's permission prompt, and
 * they can land together: closing the prompt also brings the app back to the
 * foreground. So the run is shared at module level, not per hook. A call that
 * arrives mid-run joins it, and only causes a second run if the first one
 * didn't register, because permission may have been granted after it checked.
 */
import { registerPushToken } from "@/api/endpoints";

import {
  STOP_PUSH_TIMEOUT_MS,
  ensureAttendanceChannel,
  getPermission,
  getPushToken,
  pushPlatform,
  settleWithin,
} from "./notifications";

let running: Promise<void> | null = null;
let calledAgain = false;

/**
 * Let a run that's already going finish, for a few seconds at most. Sign-out
 * waits on this before stopping push, so a run can't make the channel again
 * just after sign-out deleted it.
 */
export function waitForRegistration(): Promise<void> {
  return running === null
    ? Promise.resolve()
    : settleWithin(running, STOP_PUSH_TIMEOUT_MS);
}

export function registerThisPhone(): Promise<void> {
  if (running !== null) {
    calledAgain = true;
    return running;
  }

  running = (async () => {
    let registered = false;

    do {
      calledAgain = false;
      registered = await registerOnce();
    } while (calledAgain && !registered);
  })().finally(() => {
    running = null;
  });

  return running;
}

/**
 * True when the server took the address. Every failure is quiet: there's
 * nothing a parent could do about it, and the next return to the app tries
 * again.
 */
async function registerOnce(): Promise<boolean> {
  try {
    const platform = pushPlatform();
    if (platform === null) {
      return false;
    }

    await ensureAttendanceChannel();

    if (!(await getPermission()).granted) {
      return false;
    }

    const token = await getPushToken();
    if (token === null) {
      return false;
    }

    await registerPushToken({ token, platform });
    return true;
  } catch {
    return false;
  }
}
