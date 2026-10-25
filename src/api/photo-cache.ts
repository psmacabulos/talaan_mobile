/**
 * Erasing the children's photos this phone has kept.
 *
 * `expo-image` keeps photos on disk between launches, which is right while a
 * parent is signed in and wrong the moment they are not. CLAUDE.md is
 * explicit that **signing out and any `401`** clear the token, the cached data
 * **and the cached photos** — these are children's faces, and a phone handed
 * on or sold must not still hold them.
 *
 * It lives in its own file because there are two ways a session ends and both
 * must do this: the parent pressing Sign out, and the server rejecting the
 * token. The second is the one that is easy to forget, because nothing
 * visible happens at the time.
 */
import { Image } from "expo-image";

export async function clearPhotoCache(): Promise<void> {
  try {
    await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
  } catch {
    // A cache that cannot be cleared must not stop a parent signing out.
  }
}
