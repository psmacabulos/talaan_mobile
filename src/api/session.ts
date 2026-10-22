/**
 * What happens when the sign-in is gone.
 *
 * Any `unauthorized` answer means the token is dead (docs/PRODUCT-RULES.md,
 * "Signing in"): clear it, clear everything cached, and show sign-in.
 *
 * M2 owns the first half — clearing — and tells the app through a callback.
 * The app decides where to send the parent, because there is no sign-in screen
 * to send them to until M3, and nothing cached until M3 adds TanStack Query.
 * That keeps this module free of navigation and of the query cache.
 */
import { clearToken } from "./token";

type SignedOutHandler = () => void;

let handler: SignedOutHandler | null = null;
let signingOut = false;

/** The app registers once, at startup. M3 points this at the sign-in screen. */
export function onSignedOut(next: SignedOutHandler | null): void {
  handler = next;
}

/**
 * Clear the sign-in and tell the app.
 *
 * Several requests can fail with `unauthorized` at the same moment — a screen
 * that loads a parent and their children makes two. The guard means the parent
 * is signed out once, not once per request.
 *
 * The flag is released afterwards rather than latched: a parent who signs back
 * in and is later signed out again must be told again.
 */
export async function signOutLocally(): Promise<void> {
  if (signingOut) {
    return;
  }

  signingOut = true;
  try {
    await clearToken();

    try {
      handler?.();
    } catch {
      // The app's handler navigates (M3). If it throws, that must not replace
      // the ApiError the caller is about to receive, or the screen would
      // report a navigation failure instead of "you have been signed out".
    }
  } finally {
    signingOut = false;
  }
}

/** Tests start from a known state; production never calls this. */
export function resetSessionForTests(): void {
  handler = null;
  signingOut = false;
}
