# Step M2 — The API client

A reproducible checklist, written from the real diff.

**What you end with:** one way for the app to talk to Talaan — the address from
the environment, the token in secure storage, every answer checked with Zod,
every failure one `ApiError` — and `GET /schools` working from the phone.

## 0. Before anything

`.env` must exist and point at a server that answers:

```
EXPO_PUBLIC_API_URL="https://bantayaral.com"
```

Check it from a terminal before blaming any code:

```bash
curl https://bantayaral.com/api/v1/health
# {"ok":true,"database":"ok"}
```

The address in `docs/SERVER.md` (`bantayaral.herokuapp.com`) returns Heroku's
"no such app" page — see `docs/PROBLEMS-LOG.md`, P-007.

## 1. Packages

```powershell
npx expo install expo-secure-store
npm install zod@^4.6.5
```

Match the backend's Zod major. Do **not** add TanStack Query or React Hook Form
yet — M3 is where they first do something.

## 2. Seven files, one job each

```
src/api/config.ts      the address, from EXPO_PUBLIC_API_URL
src/api/token.ts       the token, expo-secure-store only
src/api/session.ts     what happens when the sign-in is gone
src/api/schemas.ts     every answer's shape, in Zod
src/api/errors.ts      one ApiError for every failure
src/api/client.ts      the one request() everything goes through
src/api/endpoints.ts   one typed function per address
```

Tests go in `src/api/__tests__/`. **Never under `src/app`** — Expo Router turns
every file there into a route (P-004).

## 3. The five rules worth getting right

**Read the address lazily.** A module-level throw crashes the app before any
screen can explain why, and makes tests depend on import order:

```ts
let cached: string | undefined;

export function getBaseUrl(): string {
  if (cached !== undefined) return cached;
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) throw new ConfigError("EXPO_PUBLIC_API_URL is not set…");
  if (!raw.startsWith("https://") && !__DEV__) throw new ConfigError("…https…");
  cached = raw.replace(/\/+$/, "");
  return cached;
}
```

**Keep the base URL a bare origin.** Photos are at `/api/v1/photos/<key>`,
outside `/parents`, so every path is written in full rather than baking in a
prefix.

**Give `204` its own path.** Four addresses answer with no body at all
(logout, read, read-all, push-tokens) and `response.json()` throws on an empty
one:

```ts
if (response.status === 204) return { status: response.status, json: undefined };
```

**Branch sign-out on the code, never the status.** This is the one that bites:

```ts
if (apiError.code === "unauthorized") await signOutLocally();
```

`wrong_credentials` is **also** a 401 (`docs/TALAAN-API.md:213`). Branching on
the status signs a parent out every time they mistype their password.

**Give `fetch` a timeout.** React Native's has none, so a server that accepts a
connection then says nothing hangs forever:

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15_000);
// …fetch({ signal: controller.signal }) inside try/finally clearTimeout
```

Use `AbortController`, not `AbortSignal.timeout`.

## 4. Zod 4, not 3

Checked against the installed copy:

| | |
|---|---|
| `z.object` strips unknown keys by default | which is the contract's rule, free |
| `error.issues` | `error.errors` does not exist in v4 |
| `z.record(z.string(), z.string())` | the one-argument form runs but fails `tsc` |

## 5. Nothing private on an error

`ApiError` carries the code, the server's message, `fields`, the status and the
path — and nothing else. Never the request body: on sign-in that is the
parent's password. Development logging prints field *paths*, never values:

```
[api] /api/v1/parents/schools did not match the contract: schools.0.id
```

There is a test for this. Write it.

## 6. Seeing it from the phone

M2's "done when" needs the call working *from the phone*, and no screen calls
it yet. `src/components/dev/server-check.tsx` shows one line on the sign-in
screen under `__DEV__` only — "Server reached — 3 schools", or the failure's
own message.

**M4 deletes it** when the real school picker takes over the same call.

## 7. Checks

```powershell
npm run lint
npm run typecheck
npm run check:colors
npm test
npx expo export --platform android
```

Then on the phone, with `npx expo start --clear`:

| Do this | Expect |
|---|---|
| Open the app | "Server reached — 3 schools" |
| Turn on airplane mode, reload | "Server not reached — Can't reach Bantay Aral right now…" |
| Put a wrong address in `.env`, `--clear`, reload | the same plain message, not a red screen |

## Dead end

The first design signed a parent out on **status 401**. That would have thrown
them out of the app on every mistyped password, because `wrong_credentials`
shares the status. Caught in review before it was written; see
`docs/BUILD-LOG.md`.

## 8. The 401 hole to avoid

Two rules that look contradictory are both true:

| Situation | What decides |
|---|---|
| The error shape parsed | the **code**: only `unauthorized` signs out, never `wrong_credentials` |
| The body could not be parsed at all | the **status**: any 401 signs out |

Checking the shape first and throwing on failure silently breaks the second
rule — a 401 from a proxy or CDN leaves a dead token in secure storage and the
parent stranded with no way back to sign-in. Sign out *before* throwing:

```ts
if (!parsed.success) {
  await signOutIfUnauthorized(response.status);
  throw ApiError.badResponse(path, response.status);
}
```

Test all three: a 401 in the error shape, a 401 that isn't, and a 500 that
isn't (which must *not* sign anyone out).

Also: call the app's signed-out handler inside its own `try`/`catch`. M3 puts
navigation in there, and a throw would replace the `ApiError` the screen is
waiting for.
