/**
 * Tells TanStack Query when the app comes back to the foreground.
 *
 * Query v5 does not wire React Native's app state itself — on a phone there is
 * no browser window to focus — so `refetchOnWindowFocus` would simply never
 * fire. Going through `focusManager` rather than refetching by hand from an
 * `AppState` listener matters: with both in place every query would run twice
 * on each return.
 *
 * This is what keeps a sign-in alive. The token lasts 30 days from its last
 * use, and `/me` on every return is the cheapest way to use it
 * (docs/PRODUCT-RULES.md:67).
 */
import { focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";

export function startFocusTracking(): () => void {
  let removeSubscription: (() => void) | undefined;

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (status) => {
      handleFocus(status === "active");
    });

    removeSubscription = () => subscription.remove();
    return removeSubscription;
  });

  // `setEventListener` itself returns nothing, so the subscription is kept
  // here. Without this the listener outlives the app in a test runner, which
  // is what Jest means by a worker that would not exit.
  return () => {
    removeSubscription?.();
    removeSubscription = undefined;
  };
}
