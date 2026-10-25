/**
 * Who is signed in, and how that changes.
 *
 * Two questions, deliberately kept apart:
 *
 * - **Is there a token?** Decides which half of the app a parent is in. It is
 *   answered from secure storage, without asking the server, and lives in
 *   React state rather than the query cache — `session-context.tsx` explains
 *   why that distinction cost an afternoon.
 * - **Is the token still good?** Only `/me` can say. A parent with a token
 *   stays in the signed-in half while that is being checked, and stays there
 *   if the check fails for want of internet.
 *
 * That split is what stops a journey through a dead spot looking like being
 * signed out. Only `unauthorized` ends a session (docs/TALAAN-API.md:38), and
 * the API client already turns a dropped connection into a `network` error
 * long before any sign-out path.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  getMe,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
  type SignInInput,
  type SignUpInput,
} from "@/api/endpoints";
import { clearPhotoCache } from "@/api/photo-cache";
import { clearToken, setToken } from "@/api/token";

import { deviceLabel } from "./device-label";
import { useSession } from "./session-context";

export const ME_KEY = ["parent", "me"] as const;

/**
 * `/me` is re-asked when the app returns to the foreground, but not more than
 * once every half minute. Android can hand focus back several times around a
 * permission dialog, and without this each one would be another request.
 */
const ME_STALE_MS = 30_000;

/**
 * The signed-in parent. Only asked when there is a token to ask with.
 *
 * `retry: false` because the three outcomes want different handling and
 * retrying blurs them: `unauthorized` has already cleared the token by the
 * time this resolves, a `network` failure wants a "Try again" the parent
 * controls, and a good answer wants showing.
 */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: getMe,
    enabled,
    staleTime: ME_STALE_MS,
    retry: false,
  });
}

/**
 * Forget this sign-in locally: the token, and everything cached that was
 * fetched with it (CLAUDE.md requires a 401 to clear the cached data too).
 *
 * Cached photos go too. They are children's faces, and a phone that has been
 * handed to the next parent must not still hold them — M3 reserved this and
 * M5 is the step that put photos on the screen.
 *
 * This changes state only. Nothing here navigates: the gate in
 * `src/app/_layout.tsx` watches `hasToken` and decides where the parent is, so
 * there is exactly one thing moving them.
 */
export async function forgetSession(
  queryClient: QueryClient,
  setHasToken: (hasToken: boolean) => void,
): Promise<void> {
  await clearToken();
  queryClient.clear();

  await clearPhotoCache();
  // Safe to call after clear(): this is React state, not a cached query, so
  // emptying the cache cannot orphan whoever is listening to it.
  setHasToken(false);
}

export function useSignUp() {
  const { setHasToken } = useSession();

  return useMutation({
    mutationFn: (input: Omit<SignUpInput, "deviceLabel">) =>
      signUpRequest({ ...input, deviceLabel: deviceLabel() }),
    onSuccess: async ({ token }) => {
      await setToken(token);
      setHasToken(true);
    },
  });
}

export function useSignIn() {
  const { setHasToken } = useSession();

  return useMutation({
    mutationFn: (input: Omit<SignInInput, "deviceLabel">) =>
      signInRequest({ ...input, deviceLabel: deviceLabel() }),
    onSuccess: async ({ token }) => {
      await setToken(token);
      setHasToken(true);
    },
  });
}

/**
 * Sign out on the server, then locally.
 *
 * The local half happens even when the request fails. A parent who asks to
 * sign out on a phone with no signal must still be signed out on that phone —
 * the server's own copy expires by itself after 30 days unused.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const { setHasToken } = useSession();

  return useMutation({
    mutationFn: async () => {
      try {
        await signOutRequest();
      } catch {
        // The server copy expires on its own after 30 days unused
        // (docs/TALAAN-API.md). A parent who asked to sign out on a phone
        // with no signal is signed out on that phone, and must not be shown
        // an error for something that worked.
      } finally {
        await forgetSession(queryClient, setHasToken);
      }
    },
  });
}
