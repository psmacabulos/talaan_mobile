/**
 * Keep this phone's push address current while a parent is signed in: on
 * sign-in and app start, on every return to the foreground, and whenever the
 * phone's address changes (docs/PLAN.md, Step M7).
 *
 * The foreground comes from TanStack's `focusManager`, the same signal that
 * re-asks `/me` (src/auth/focus.ts), rather than a second AppState listener.
 * Registering on every return is also what keeps the 30-day sign-in, and its
 * pushes, alive (CLAUDE.md, "Keep the sign-in alive").
 */
import { useEffect } from "react";

import { focusManager } from "@tanstack/react-query";

import { useSession } from "@/auth/session-context";

import { onPushTokenChange } from "./notifications";
import { registerThisPhone } from "./registration";

export function usePushRegistration(): void {
  const { hasToken } = useSession();

  useEffect(() => {
    if (hasToken !== true) {
      return;
    }

    void registerThisPhone();

    const stopWatchingFocus = focusManager.subscribe((focused) => {
      if (focused) {
        void registerThisPhone();
      }
    });
    const stopWatchingToken = onPushTokenChange(() => {
      void registerThisPhone();
    });

    return () => {
      stopWatchingFocus();
      stopWatchingToken();
    };
  }, [hasToken]);
}
