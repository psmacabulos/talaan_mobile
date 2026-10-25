/**
 * The sign-in token, kept only in the phone's secure storage.
 *
 * CLAUDE.md, "Students are minors": the token lives only in
 * `expo-secure-store` — never AsyncStorage, never a log, not even in
 * development. On Android this is backed by the system keystore, so another
 * app can't read it.
 *
 * The token is `tal_par_…`, one per phone, and lasts 30 days from its last
 * use (docs/TALAAN-API.md). Every request keeps it alive, which is why the app
 * calls the server on each start and each return to the foreground.
 *
 * **There is one in-memory copy, and it lives here.** Reading the keystore is
 * asynchronous, and a child's photo needs the token *synchronously* to put on
 * an image request header (`expo-image` takes headers on its source, and
 * cannot await). Rather than letting a screen keep its own copy, the single
 * copy is held beside the storage that owns it: written by `setToken`, erased
 * by `clearToken`, so it cannot outlive the sign-in it belongs to. It is
 * deliberately **not** in the query cache, which `forgetSession` clears but
 * which other resets would leave untouched.
 */
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bantayaral.parent.token";

/** `undefined` means the keystore has not been read yet this launch. */
let cached: string | null | undefined;

/**
 * Secure storage can fail on a phone whose keystore is unavailable. A token we
 * can't read is the same as not being signed in, so every failure here is
 * treated as "no token" rather than crashing a parent out of the app.
 */
export async function getToken(): Promise<string | null> {
  if (cached !== undefined) {
    return cached;
  }

  try {
    cached = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cached = null;
  }

  return cached;
}

/**
 * The token without waiting, for the one caller that cannot await: the header
 * on a child's photo request.
 *
 * Null until `getToken` has run once, which it always has by then — the app
 * asks `/me` before any photo exists to show.
 */
export function getTokenNow(): string | null {
  return cached ?? null;
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  cached = token;
}

export async function clearToken(): Promise<void> {
  // Forget it here first. If the keystore delete throws, the app must still
  // stop sending this token.
  cached = null;

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Already gone, or the keystore is unavailable. Either way there is
    // nothing left to clear.
  }
}

/** Tests start from a known state; production never calls this. */
export function resetTokenCacheForTests(): void {
  cached = undefined;
}
