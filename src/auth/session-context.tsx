/**
 * Whether this phone holds a sign-in token.
 *
 * **This deliberately does not live in the query cache.** It was there once,
 * and signing out hung the app (docs/PROBLEMS-LOG.md, P-009):
 * `queryClient.clear()` destroys the query a mounted `useQuery` is attached
 * to, and a `setQueryData` afterwards creates a *different* query that the
 * orphaned observer never sees. The gate stopped being told anything, so
 * nobody was ever moved to the sign-in screen.
 *
 * The deeper reason is that this was never server state. TanStack Query looks
 * after answers from a server — things that can be stale, refetched, retried.
 * "Is there a token on this phone" is none of those. It is local state, it
 * changes only when this app changes it, and it belongs in React state where
 * clearing the cache cannot touch it.
 *
 * The token's **value** is never here either. Only whether one exists. It
 * lives in `expo-secure-store` and nowhere else (CLAUDE.md, "Students are
 * minors").
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getToken } from "@/api/token";

type Session = {
  /** Undefined until secure storage has been read once, at startup. */
  hasToken: boolean | undefined;
  setHasToken: (hasToken: boolean) => void;
};

const SessionContext = createContext<Session | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasTokenState] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let listening = true;

    getToken()
      .then((token) => {
        if (listening) {
          setHasTokenState(token !== null);
        }
      })
      .catch(() => {
        // A token that can't be read is the same as not being signed in.
        if (listening) {
          setHasTokenState(false);
        }
      });

    return () => {
      listening = false;
    };
  }, []);

  const setHasToken = useCallback((next: boolean) => {
    setHasTokenState(next);
  }, []);

  const value = useMemo(
    () => ({ hasToken, setHasToken }),
    [hasToken, setHasToken],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);

  if (session === undefined) {
    throw new Error("useSession must be used inside a SessionProvider");
  }

  return session;
}
