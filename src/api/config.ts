/**
 * Where the server is.
 *
 * Never hard-coded: the owner sets `EXPO_PUBLIC_API_URL` in `.env`, and
 * `docs/SERVER.md` says which server to point at (Heroku by default, Talaan on
 * the Mac as a fallback). `EXPO_PUBLIC_*` values are baked into the bundle
 * when it is built, so a change needs `npx expo start --clear`.
 *
 * A base URL in the bundle is fine — it is public either way. A secret must
 * never be an `EXPO_PUBLIC_*` value: anyone with the APK can read it.
 *
 * This reads the value when it is first asked for, not when the module loads.
 * Throwing at import time would crash the app before any screen could explain
 * why, and would make tests depend on import order.
 */

/** The bare origin, with no trailing slash. Paths carry their own prefix. */
let cached: string | undefined;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getBaseUrl(): string {
  if (cached !== undefined) {
    return cached;
  }

  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!raw) {
    throw new ConfigError(
      "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env (docs/SERVER.md).",
    );
  }

  // Plain http reaches Talaan on the Mac in development only. Android blocks
  // it in a release build (docs/SERVER.md), so catch it here rather than
  // letting a build fail silently on a phone.
  if (!raw.startsWith("https://") && !__DEV__) {
    throw new ConfigError(
      "EXPO_PUBLIC_API_URL must use https outside development (docs/SERVER.md).",
    );
  }

  // Kept in a local as well, so what is returned is plainly a string.
  // Relying on TypeScript narrowing a module-level `let` typechecked on a
  // developer's machine and failed in CI, which sees a different set of
  // global types (docs/PROBLEMS-LOG.md, P-010).
  const base = raw.replace(/\/+$/, "");
  cached = base;

  return base;
}

/** Tests set the variable per case; production never calls this. */
export function resetBaseUrlForTests(): void {
  cached = undefined;
}
