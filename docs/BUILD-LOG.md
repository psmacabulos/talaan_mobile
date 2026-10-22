# Build log

How each step was actually built: the commands run, what was chosen and why,
and every error hit along the way.

## M1 — Set up the project

**Date:** 2026-10-21

### Before anything: Node

The machine had Node v20.19.4. SDK 58 needs 22.13+, 24.3+ or 26+, and
`CLAUDE.md` asks for Node 24 to match the backend. nvm-windows had already
downloaded v24.11.0 but was still pointing at v20 — `nvm install` doesn't
switch. `nvm use 24.11.0` from an Administrator PowerShell fixed it.

### Choosing the SDK

The plan first proposed SDK 57 over 58, on the reasoning that 58 was six days
old. That was reversed before any code was written, because **each Expo Go
build ships exactly one SDK version and auto-updates to the newest**. Expo Go
on the Play Store is SDK 58, so an SDK 57 project refuses to open in it, and
choosing 57 would have forced a development build at M1 — pulling M7's EAS
setup to the start and spending the free monthly build allowance before a
single screen existed.

Checked before committing to 58: `jest-expo@58.0.11` tracks the SDK, and `expo`
was already on `58.0.16` — sixteen patch releases in six days.

### Scaffolding

The generator was run in a scratch folder rather than the repository, so every
file it produced could be read before any of it was copied in:

```bash
npx --yes create-expo-app@latest scaffold --template default --no-install
```

Three things it generates were deliberately **not** taken:

| What | Why not |
|---|---|
| `.git/` | The repository already has its own history |
| `.claude/settings.json` | Would have replaced the owner's, which blocks git commands |
| `AGENTS.md` | Not used here |

Taken from it: `tsconfig.json` (already `strict`, with `@/*` → `./src/*`),
`.gitignore`, and the six placeholder icon and splash images that
`app.config.ts` references. The example screens and components
(`explore.tsx`, `themed-text`, `app-tabs`, the React logos) were not copied.

`.gitignore` was extended with `.env`, `.env.local`, `google-services.json` and
`*-service-account*.json`. The last two are for M7, added now so a Firebase
credential can never be committed by accident.

### Packages

Dropped from the template as unused on Android: `@expo/ui`,
`expo-glass-effect`, `expo-symbols`, `expo-web-browser`. Deferred to the step
that needs them: `expo-image` (M5) and `expo-device` (M3).

`react-dom` and `react-native-web` were dropped too, and had to be put back —
see P-001 below.

Added: `react-native-svg` (the logo), `@expo-google-fonts/lexend` and
`@expo-google-fonts/atkinson-hyperlegible` (0.4.1 each), and for development
`jest-expo`, `jest`, `@testing-library/react-native`, `eslint`,
`eslint-config-expo`, `prettier`.

### The theme

`src/theme/colors.ts` holds 11 semantic tokens per scheme, 5 status colours and
9 brand colours, straight from `docs/DESIGN.md`. One token was added that the
design doc doesn't list: `skeleton`, for M5's loading placeholders. It is the
same value as `muted`, so it introduces no new colour — only a name for the job.

`src/theme/colors.ts` imports nothing. That was deliberate, so `app.config.ts`
could read the icon colour from it. It turned out Expo can't do that at all
(P-002), but the constraint is worth keeping: it makes the file safe to read
from anywhere.

Every pair a parent reads was measured against WCAG AA before the screen was
built. All 36 pass; the tightest are `link` on `background` in light at 4.62
and brand green text at 4.68. The dark values match what `docs/DESIGN.md`
claims exactly (8.70 for green text), which is a good sign the conversion from
the web app's OKLCH was right.

One mistake here: the first version of `contrast.test.ts` also asserted that
`border` stood out from `background` at 1.2:1. Light measures 1.17, so the test
would have failed on colours that are perfectly correct — a card's edge is
meant to be subtle. `docs/DESIGN.md` asks for 4.5:1 on text and 3:1 on large
text and icons, and says nothing about dividers. The invented assertion was
removed rather than the threshold lowered.

### The logo

`reference/mark-shapes.ts` stays where it is: `docs/PLAN.md:17` points at that
path, and it holds 15 colour literals that would trip `check:colors` if it
moved under `src/`. Only the geometry (its lines 13–28) was copied to
`src/components/brand/mark-shapes.ts`, verbatim via `sed` so nothing could be
mistyped. The colours come from the theme's brand tokens, so the copied file
has no colour literal in it.

### The colour check

`scripts/check-color-literals.mjs` scans `src/` for hex, `rgb()`/`rgba()` and
named colour strings outside `src/theme`. It was tested by deliberately adding
`backgroundColor: "#FF0000"` and `borderColor: "white"` to the screen; it
caught both and exited 1. A check that has never failed isn't a check.

### Errors hit

| | What happened | Where it's written up |
|---|---|---|
| 1 | `ERESOLVE` on `react-dom@19.3.1` vs `react@19.3.0` after trimming the template | P-001 |
| 2 | Every Expo command failing with `Cannot find module './src/product'` | P-002 |
| 3 | `npm install` taking over 10 minutes | P-003, still open |

P-002 is the one worth remembering: `app.config.ts` cannot import from `src/`,
because Expo transpiles it to standalone CommonJS. The values are written out
in the config now, and `app.config.test.ts` asserts they match `src/product.ts`
and `src/theme/colors.ts` so the two copies can't drift.

### Getting the tests to run

Three things in this toolchain cost real time, none of them obvious from the
error text.

**No Jest setup file.** `jest.setup.js` started out requiring
`@testing-library/react-native/extend-expect`. That entry point no longer
exists: the library has included its own matchers in the main export since
v12.4. The file was deleted and `setupFilesAfterEach` removed from
`jest.config.js`.

**`render` is async in v14.** Every test in `index.test.tsx` failed with
`getByText is not a function`, and before that with `screen` insisting render
had never been called. Neither message says what's wrong. Probing the return
value settled it:

```
typeof result: object
result.getByText: undefined
proto keys: constructor, then, catch, finally
```

`then`, `catch`, `finally` — it's a promise. `await render(...)` fixed all
three tests at once.

**`"types": ["jest"]` in tsconfig.** Installing `@types/jest` was not enough;
TypeScript still reported `Cannot find name 'describe'` on every test file.
Expo's `tsconfig.base` doesn't restrict `types`, so automatic inclusion should
have worked and didn't. Naming it explicitly fixed it.

### The environment

Five packages installed incompletely during this step: npm reported success,
but the folder was missing files.

| Package | Presented as |
|---|---|
| `@testing-library/react-native` | `Cannot find module ... or its corresponding type declarations` |
| lodash | `Module jest-expo should have "jest-preset.js" at the root` (it did) |
| `@typescript-eslint/scope-manager` | ESLint dying in a stack trace |
| `es-abstract` | ESLint dying in a different stack trace |

Each looked like a different problem — a missing dependency, a broken Jest
preset, an ESLint plugin fault. None of them was. Repairing them one at a time
stopped converging after the fourth, so the tree was rebuilt with `npm ci`.

The cause is the repository living inside OneDrive (P-003). This is the single
thing most worth fixing before M2: it cost more time in M1 than every real
coding problem combined.

### The check that only an export catches

With lint, types, colours and 48 tests all green, `npx expo export --platform android`
still found something: `src/app/index.test.tsx` was being bundled into the app,
pulling `@testing-library/react-native` with it, because Expo Router treats
every file under the app directory as a route (P-004). The test moved to
`src/__tests__/sign-in-screen.test.tsx`.

Worth repeating at every step: an export is the last check, and the only one
that sees what a parent would actually download.

### The SDK call was wrong, and why

The plan went 57 → 58 on this reasoning: each Expo Go build ships one SDK and
auto-updates to the newest, so an SDK 57 project would be refused by the Expo
Go on the Play Store.

The first half is right. The conclusion wasn't, because the store build **lags
the SDK release** while Google reviews it. SDK 58 shipped 2026-10-15; its Expo
Go still wasn't in the Play Store on 2026-10-21. So during this window it is
SDK 58 that Expo Go refuses — the exact opposite of what was predicted, and the
owner hit it on their first run (P-005).

Resolved by installing Expo Go 58.0.5 by hand from Expo's own releases, rather
than downgrading. Downgrading to 57 would work today and break in a few weeks
when the store catches up, probably mid-step.

The checkable fact that should have been looked up before deciding:

```
https://api.expo.dev/v2/versions/latest
```

It lists, for every SDK, the Expo Go client version and a direct APK URL. One
request would have shown the store lag and saved the owner a failed run.

## M2 — The API client

**Date:** 2026-10-21

### Packages

`zod` (4.6.7, matching the backend's `^4.6.5`) and `expo-secure-store`
(~58.0.2). Both were already named in `CLAUDE.md`'s stack. TanStack Query and
React Hook Form were deliberately left out: nothing needs them until M3.

Zod 4 differs from 3 in ways that matter here, checked against the installed
copy rather than assumed:

| | Result |
|---|---|
| `z.object` strips unknown keys | yes — which is exactly the contract's rule |
| `error.issues` | exists; `error.errors` does not |
| `z.record(z.string())` | runs, but fails `tsc` — Zod 4 wants key *and* value |

### The shape

Seven small files under `src/api/`, one job each: `config.ts` (the address),
`token.ts` (secure storage), `session.ts` (being signed out), `schemas.ts`
(Zod), `errors.ts` (one `ApiError`), `client.ts` (the one `request()`),
`endpoints.ts` (one function per address).

Only `GET /schools` and only the `School` schema are implemented. Every other
address arrives with the step that uses it, so the app never carries code for a
screen that doesn't exist.

### The bug the review caught before it was written

The first design signed a parent out on **status 401**. `wrong_credentials` is
also a 401 (`docs/TALAAN-API.md:213`), so that would have thrown a parent out
of the app every time they mistyped their password in M3 — and it would have
looked like a session bug, not a login bug.

It branches on `code === "unauthorized"` instead, with a test for each half.

### Four things that came from the contract, not from guessing

1. Four addresses answer `204` with no body, and `response.json()` throws on an
   empty one. Hence `requestNoContent()` alongside `request()`.
2. Photos live at `/api/v1/photos/`, outside `/parents`, so `config.ts` holds
   the bare origin and every path is written in full.
3. The error shape is one shape for every failure, including `fields`.
4. An unknown error code still carries the server's own message, so a code
   added later never leaves a parent staring at a blank screen.

### Things the contract doesn't cover

React Native's `fetch` has no timeout, so a server that accepts a connection
and then says nothing would hang forever. An `AbortController` ends it at 15
seconds and feeds the same "no answer" path as having no internet.

### The live server has moved

`GET /schools` against `https://bantayaral.herokuapp.com` returned Heroku's
"no such app" page. The API is live at `https://bantayaral.com`, with the same
three schools, and its answer was validated against this app's own Zod schema —
it matches exactly. Written up as P-007; `.env.example` now points at the
working address, and `docs/SERVER.md` is left for the owner to confirm.

### Seeing it from the phone

M2's "done when" is that the call works from the phone, and no screen calls it
yet. `src/components/dev/server-check.tsx` shows one line on the sign-in screen
in development only — "Server reached — 3 schools" or the failure's own
message. It renders nothing in a release build, and **M4 deletes it** when the
real school picker takes over the same call.

### Tests

23 cases against a fake `fetch`: every code in the contract's table, an unknown
code, a field-level `invalid_input`, both halves of the 401 split, three
concurrent 401s signing out once, a dropped connection, a timeout, a non-JSON
body, a shape Zod rejects, a failure that isn't the error shape, a `204`, and
one asserting that a password sent in a request body never reaches the error.

### The hole the code review found

The 401 handling had a gap that only shows up in production. The code checked
the error shape first:

```ts
const parsed = errorBodySchema.safeParse(json);
if (!parsed.success) throw ApiError.badResponse(path, response.status);
```

So a 401 whose body **isn't** the contract — HTML from a proxy, a CDN's login
page, `{"oops":true}` — threw before ever reaching the sign-out check. The dead
token stayed in secure storage, the parent saw "Something went wrong", and
every later request failed the same way with no route back to sign-in.

The contract leaves no room: "Any `401` means signed out"
(docs/TALAAN-API.md:38). Signing out now happens on the status whenever the
body can't be parsed, before the error is thrown — in both the unparseable-JSON
and wrong-shape branches. Three tests cover it, including one proving a 500
with the same unparseable body does *not* sign anyone out.

Worth noting where this came from: the earlier fix ("branch on the code, never
the status") was right, and following it too literally created the opposite
bug. Both rules hold at once — the code decides for a *parsed* error, the
status decides when there is nothing to parse.

A second fix in the same pass: `session.ts` called the app's signed-out handler
inside the `try`, so a handler that throws — and M3 puts navigation there —
would replace the `ApiError` the caller was about to receive. The screen would
report a navigation failure instead of "you have been signed out". The handler
now has its own `try`/`catch`.

### The dev-only check had a cost I missed

`<ServerCheck />` calls the API on mount, so the sign-in screen's own test
started making a real HTTPS request — passing or failing depending on how fast
the connection was that minute (P-008). The owner hit it as a five-second
timeout on an assertion that had nothing to do with the cause.

The code review asked whether temporary code in a screen was the right call,
and the answer was yes, with the deletion scheduled in M4. That was right about
the app and wrong about the tests: anything that calls the API from shared
screen furniture becomes a mock every screen test has to remember. Mocked in
the screen test, and worth weighing before the next component that fetches on
mount.

## M3 — Sign up, sign in, sign out

**Date:** 2026-10-22

### Packages

`@tanstack/react-query` 5.104.5, `react-hook-form` 7.90.0 (the backend uses
^7.89.0), `expo-device` 58.0.5 — all named in `CLAUDE.md`'s stack — plus
`@hookform/resolvers`, which is not, and was approved with the plan.

**`@hookform/resolvers@6` cannot be installed here.** Its optional peer wants
`effect@^4`, while its own `@typeschema` dependency tree pulls `effect@^3`:

```
npm error peerOptional effect@"^4.0.0" from @hookform/resolvers@6.0.0
npm error Found: effect@3.22.3
```

None of that is used — those peers exist for Effect Schema, Valibot, Joi and
the rest. v5.9.2 lists `zod: ^3.25.0 || ^4.0.0` and installs cleanly, so the
dependency is pinned to `^5.9.2`.

### Two owners of navigation, avoided

The first design had the gate in `_layout.tsx` **and** `onSignedOut` calling
`router.replace`. Two things moving a parent is a race waiting to happen.

`onSignedOut` now only clears state — the query cache, and the "is there a
token" flag. The gate watches that flag and is the only thing that navigates.
A `401` therefore travels: API client clears the token → handler clears the
cache → the flag flips → the gate moves the parent. No step of that chain
knows where sign-in is except the last.

### A routing bug worth remembering

`src/app/index.tsx` and `src/app/(app)/index.tsx` **both resolved to `/`**. A
route group in parentheses adds no path segment, so `(app)/index.tsx` is not
`/app` — it is `/`, colliding with the root screen.

The signed-in screen is now `(app)/home.tsx` → `/home`, and `/` is a neutral
"Checking your sign-in…" screen belonging to neither group. That forced a
second fix: the gate originally asked "are they in the wrong half?", which
left a signed-in parent sitting on `/` forever, in neither half. It now asks
"are they where they belong?" and moves them either way.

### No internet is not being signed out

`/me` failing on a cold start has three meanings and they must not be blurred:
the token was rejected, the server could not be reached, or it answered.

Only the first ends a session. The second keeps the parent signed in and
offers "Try again" — being on a tricycle with no signal should not log anyone
out. The API client already made this easy: a dropped connection becomes
`kind: "network"` long before any sign-out path.

### The privacy trap in `deviceLabel`

`deviceLabel` is sent to the server and kept. The obvious property to reach for
is `Device.deviceName` — and Expo's own documented example for it is
**"Vivian's iPhone XS"**. It is set by whoever owns the phone and routinely
contains a real name, so using it would have sent a parent's name to the
backend on every sign-in.

It uses `Device.modelName` ("Pixel 7"), with a test that fails if anyone
swaps it back.

### Tests

107 across 6 suites. The new ones: every field rule in
`docs/PRODUCT-RULES.md` with its exact message, including six ways a Philippine
mobile number can be wrong; the `deviceLabel` privacy property; and the sign-in
screen's three server answers — a wrong password keeps the email, too many
tries leaves the button enabled, and no internet is said plainly rather than as
a password problem.

### What the code review caught

Four things, all of them quiet failures rather than crashes:

1. **`clear()` then `invalidateQueries` is a no-op.** `clear()` removes the
   query being invalidated, so nothing was left to invalidate and the gate only
   learned the token was gone when something else happened to re-render.
   `setQueryData(HAS_TOKEN_KEY, false)` says it outright.
2. **A field name the form doesn't have failed silently.** The screens wrote
   every `fields` message onto a form field by name. `deviceLabel` is sent with
   every sign-in and is on no form — a complaint about it would have stopped
   the spinner and shown the parent nothing at all. Messages that don't land
   now fall back to the error's own text (`src/auth/server-errors.ts`).
3. **Signing out ended in an error state.** The request error propagated after
   the local clear, so an offline sign-out that worked still looked broken.
4. **The focus listener was never removed.** Returning `void` from
   `startFocusTracking` — done earlier to satisfy a type error — meant the
   `AppState` subscription outlived the app. That was the Jest warning about a
   worker that wouldn't exit. Returning the cleanup, plus `gcTime: 0` in the
   test's query client, cleared it.

### The bug that got through everything

Every check passed, 109 tests were green, and signing out hung the app for
ever (P-009). Two mistakes stacked:

`hasToken` was a cached query, and `forgetSession` cleared the cache —
destroying the very query the gate was watching, so the gate was never told
anything. The fix was to stop treating it as server state at all: it is local
state and now lives in React state, where clearing the cache cannot reach it.

And the screen branched on `me.isPending`, which in React Query v5 is `true`
for ever on a **disabled** query. The moment `hasToken` went false, `useMe`
was disabled and the screen froze on "Checking your sign-in…". It branches on
`me.data` now.

What the tests got wrong is the more useful lesson. Each one rendered a single
screen in isolation with everything around it mocked, which is exactly why
they all passed: the bug lived in the seam between the session, the cache and
the gate, and nothing had ever rendered those three together.
