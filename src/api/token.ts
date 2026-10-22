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
 */
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bantayaral.parent.token";

/**
 * Secure storage can fail on a phone whose keystore is unavailable. A token we
 * can't read is the same as not being signed in, so every failure here is
 * treated as "no token" rather than crashing a parent out of the app.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Already gone, or the keystore is unavailable. Either way there is
    // nothing left to clear.
  }
}
