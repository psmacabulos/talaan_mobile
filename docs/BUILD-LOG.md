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

## M4 — Link a child

**Date:** 2026-10-22

### The bug that would have broken the demo

The birth date has to reach the server as `YYYY-MM-DD`, and the obvious way to
get there from a date picker is `toISOString().slice(0, 10)`. Under
`TZ=Asia/Manila`:

```
parent picked      : Mon Mar 03 2014
via toISOString()  : 2014-03-02   ← what would have been sent
via local fields   : 2014-03-03
```

A date picker hands back **local midnight**, and local midnight in UTC+8 is
still the previous day in UTC. Every birth date would have gone one day early.

`2014-03-03` is Jose Pascual's birth date in `docs/SERVER.md` — the demo
student. Linking him would have answered `404 not_found`, "no match", with the
parent looking at four details they had entered perfectly and a birth date the
app is not allowed to show back. There is no error message in that chain that
points anywhere near a timezone.

`src/lib/calendar-date.ts` builds the string from `getFullYear`, `getMonth`
and `getDate`, with five tests.

### `/me` had to start returning children, carefully

M3 deliberately parsed only `parent`: an unexpected child shape must never
stop a parent signing in. M4 needs the children, and a plain
`z.array(childTodaySchema)` would have undone that — one child with a status
the app doesn't know would fail the whole answer, and `/me` failing takes the
signed-in app with it.

`tolerantChildren` checks each child on its own and drops the ones it cannot
read. One unreadable child costs that child's row, not the parent's session.
There is a test with three children and a bad one in the middle.

### Not seeding the cache

The `201` returns the linked child, so writing it straight into the `/me`
cache is tempting. Invalidating instead: one cheap call, no chance of the
cache drifting from what the server would say, and it refreshes the 30-day
token at the same time. A `409` invalidates too — a stale list is the likeliest
reason a parent tried to add the same child twice.

### What a `404` is allowed to say

It means nothing matched **all four** details, and the server does not say
which. Neither does the app: it shows the server's own words, then one static
line naming all four things to check. Guessing "check the birth date" would be
wrong most of the time.

### Packages

`@react-native-community/datetimepicker` (expo install chose 9.2.1 for this
SDK), MIT, no account. Added because the birth date is "a date picker, never
typed free-hand" — a parent typing 03/04/2014 can mean two different days and
the server would only ever say "no match".

No package for the school picker. Three schools is a modal and a list, and
owning it keeps the tokens, the 48-point targets and the screen-reader
behaviour identical to every other field.

### Also

`server-check.tsx` is gone, as M2 promised and M4's checklist required. Home
grew a plain list of linked children — name, class, school — which is the
smallest thing that makes M4's "the new child appears at once" visible. M5
replaces each row with the real card.

### What the code review caught

One real thing: `home.tsx` had a literal `` `Grade ${gradeLevel} – ${section}` ``
in the markup. Every parent-facing string belongs in `src/strings.ts` ready
for a Filipino translation, so it became a small formatter there — a function
rather than a sentence, because a translation will want the pieces in its own
order. M5 reuses it on the real card.

It also flagged something worth writing down rather than fixing: the date
picker is **Android-shaped**. `display="spinner"` is a dialog on Android that
fires `onChange` once, but renders *inline* on iOS and fires on every tick of
the wheel — so closing on the first event would, on iOS, shut the picker at
the first nudge and commit a half-scrolled date. That is now a comment in the
file and a section in the step recipe, so iOS is a known `Platform.OS` branch
rather than a surprise.

Plus two small ones: the "check these four things" line sat outside the live
region, so a screen reader announced the error without the part that says what
to do; and a negative margin on the LRN hint would have crowded the field at
200% font.

### CI had been red since M2

Three steps were reported as "all checks pass" while GitHub Actions had been
failing on every push since M2 (P-010). `expo-env.d.ts` is generated by Expo
and gitignored by Expo, so it exists locally and never in CI — and with
`"types": ["jest"]` in `tsconfig.json`, that one file is the only route to
Expo's global types. The two environments were typechecking different worlds.

Fixed in two places: `src/types/expo.d.ts` is committed so both sides see the
same globals, and `getBaseUrl` no longer leans on TypeScript narrowing a
module-level `let`.

The habit that was missing is simple: run the checks the way CI runs them
before saying they pass. Hiding `expo-env.d.ts` and `.expo/` reproduces CI
exactly, and all four checks now pass that way.

### A string edit that typechecked and still broke

A `perl -0pi -e` replacement containing `${gradeLevel}` had those placeholders
interpolated by **perl**, not left for JavaScript — so
`` `Grade ${gradeLevel} – ${section}` `` was written to disk as
`` `Grade  – ` ``. Every child would have read "Grade  – " with no grade and
no section.

It typechecked, because an empty template literal is perfectly valid, and
nothing asserted the text. There is a test for it now, including one that
fails if the placeholders ever vanish again. The wider lesson is to stop using
`perl` substitution for anything containing `${...}`.

## M5 — Home

**Date:** 2026-10-25

### The school's clock

`src/lib/school-time.ts`, ported from `reference/school-time.ts`. A parent
working in Dubai must see the time their child walked through the gate in
Balanga — "7:56 AM" — not "3:56 AM", which is what their own phone would say.

So it never touches `toLocaleTimeString` or `Intl`: `Date.parse` gets the
right instant from the offset in the string, that instant moves forward eight
hours, and the **UTC** fields are read. Android's support for named time zones
also varies between handsets, which is the second reason.

The first version of the test mocked `Date.prototype.getTimezoneOffset` to
pretend the phone was elsewhere. That proved nothing — the helper never calls
it — and ESLint complaining about extending a native prototype is what
prompted a second look. It now spies on the three locale formatters and
asserts none is called, which is the rule itself. Inserting
`clock.toLocaleTimeString()` into the helper fails exactly that test; removing
it passes 11 of 11.

### One copy of the token, and where it lives

A child's photo is private: `GET /api/v1/photos/<key>` only answers with the
parent's token, and `expo-image` takes the header on its source — **without
being able to await the keystore**.

Rather than a screen keeping its own copy, the single in-memory copy now sits
in `src/api/token.ts` beside the storage that owns it: written by `setToken`,
erased by `clearToken` *before* the keystore delete, so a throw there still
stops the app sending it. Every API request got faster as a side effect, since
the client no longer reads the keystore per call.

Deliberately **not** in the query cache: `forgetSession` clears that, but any
other reset would leave a token sitting in a cache dump.

### Photos and signing out

The contract says a photo is `immutable` per path and "a phone keeps a photo it
has loaded even after the child is unlinked", which reads like a conflict with
CLAUDE.md's "signing out clears the cached photos". It isn't: `immutable`
governs **re-fetching**, sign-out governs **erasing**. `forgetSession` now
clears both of expo-image's caches. M3 had already left a note reserving this
for M5.

The method names were checked against the installed package rather than its
docs — `clearMemoryCache` and `clearDiskCache` both exist, as does
`headers?: Record<string, string>` on the source.

### A photo that fails must not sign anyone out

A photo request does **not** go through `src/api/client.ts`, so a `401` on it
never reaches the one error handler. That is the right behaviour, stated
explicitly in the file: a parent on a patchy connection sees a grey box with
their child's initials, not the sign-in screen. A genuinely dead token is
caught by `/me`, which does go through the client.

### Weekends

`today.flexible` means the school has no late and no absent that day. So
"Present" becomes "Came in", and the rather accusing "Not yet tapped" becomes
"No tap". There is a test asserting that no weekend status can ever produce
"Absent" or "Late".

### Skeletons stand still

A shimmer is the fashion, but CLAUDE.md requires motion to stop when the phone
asks for reduced motion, and a skeleton animates on every single load. A plain
block says the same thing and asks nothing of anyone. They are also hidden from
screen readers, which should hear the real content when it arrives.

### What the code review caught

Three, and the first was a privacy gap rather than a bug.

**A `401` did not clear the photos.** Pressing Sign out did, but a token that
expired or was revoked went down a different path — `signOutLocally` clears
the token, and the handler cleared the query cache and the session flag, and
nothing cleared the images. CLAUDE.md:56 is explicit: "Signing out, **and any
`401`**, clear the token, the cached data and the cached photos." So a 30-day
expiry left children's faces on the phone's disk. Both paths now call one
`clearPhotoCache()`.

It is the easy one to miss because nothing visible happens at the time: no
button was pressed, no screen changed, and the photos are not on screen to
remind anyone they exist.

**A failed refresh wiped the cards.** The screen checked `me.isError` before
it checked whether it had data, and `/me` does not retry — so one pull in a
tunnel replaced a child's whole morning with an error message. The full error
is now only for when there is nothing to show; otherwise the cards stay and
the failure is a line above them.

**The spinner span on its own.** `isRefetching` is also true when the app
returns to the foreground and re-asks `/me`, so coming back from the home
screen spun a pull-to-refresh control nobody had pulled. A local flag now
separates a real pull from a background refresh.

Also: `cachePolicy` went from `disk` to `memory-disk`, because `disk` decodes
the image again on every remount; and each card became one accessibility
group, so TalkBack reads a child in one swipe rather than six.

### One thing for the backend

`docs/API-REQUESTS.md` now has its first entry. The app drops a child whose
`status` it cannot read, which is right for a malformed answer and wrong for a
status that is merely newer than the app — a future `excused` would make
children silently vanish from phones already in parents' hands. Two possible
answers are written up there for the owner to take to the Talaan repository.

## M6 — The feed and a child's day

**Date:** 2026-10-25

### Two tabs, not five

M6's checklist asks for the unread badge "on the feed's tab", and until now the
app had no tabs at all. The owner's mockup shows five; they chose **two** —
Home and Notifications. Attendance has no API behind it, Profile is after the
demo, and a tab leading to "coming later" is worse than no tab. Adding the
others is additive, and the gate in `src/app/_layout.tsx` still works unchanged
because `segments[0]` is still `(app)` under `<Tabs>`.

### The refetch storm that would have shipped

`new QueryClient()` has no `staleTime`, so everything defaults to zero, and
focus tracking is wired. An infinite query in Query v5 refetches **every page
already loaded**, one after another, whenever the app comes back to the
foreground.

A parent who had scrolled through five pages would have fired five requests
each time they opened the app — on mobile data, in a province where that is
not free. The feed now has `staleTime: 30_000`, matching `/me`, and
`maxPages: 3`.

The same reasoning kept the badge on its own key. Reading `unreadCount` out of
the feed's query would have meant mounting the feed — and keeping all its
pages alive and refetching — for the sake of one number that has to be visible
on every screen.

### The count cannot be decremented

`unreadCount` stops at 10 on the server: ten means "ten or more". So after
marking one read, the app has no way to know the real number and cannot
subtract.

Marking read therefore does two different things on purpose: the **feed** is
updated in place with `setQueryData` — a read mark only ever travels one way,
so there is nothing to roll back and no reason to refetch every page to change
one boolean — and the **badge** is invalidated, because only the server knows
what the number is now.

Read marks are also shared by a child's guardians: when one parent reads a
notification it is read for the other too, and their count drops. Another
reason the app must not invent a number.

### The cursor is the server's, not ours

`nextBefore` is opaque and goes back exactly as it arrived. It is base64, so it
is URL-encoded on the way out — a raw `+` in a query string arrives as a space,
and the server answers `400` for a cursor it did not issue rather than quietly
returning the first page. There is a test for exactly that: `a+b/c=` must
become `before=a%2Bb%2Fc%3D`.

### Lists that survive a row they cannot read

M4's tolerant children array became a generic `tolerantArray`, now used for
children, notifications and taps alike. A `kind` the server adds later costs
one row, not the whole page — and the feed is the screen a parent opens after a
push, so it failing wholesale would be the worst possible moment.

### What the code review caught, including its own earlier advice

**`maxPages: 3` had to go — and it was the reviewer's own round-1 suggestion.**
It looked like a sensible cap on a refetch storm. It isn't: without a
`getPreviousPageParam`, Query drops the *oldest* pages as new ones arrive. So a
parent scrolling a long feed would watch rows vanish from under their thumb,
the scroll jump, and those rows never come back.

The storm it was meant to prevent is solved properly by
`refetchOnWindowFocus: false` on the feed alone. The badge and `/me` still run
on focus, which is what keeps the token alive and tells a parent something new
arrived; pulling down is the explicit way to ask for more. Both the reason and
the abandoned attempt are written into the file, so nobody adds it back.

**Signing out could have looped.** `useUnreadCount()` had no `enabled` guard,
unlike `useMe(hasToken === true)`. Sign-out calls `queryClient.clear()` while
the tabs are still mounted, so the badge would refetch — the client sends no
Authorization header when there is no token — earn a `401`, and the 401 path
would clear again. Clear, refetch, 401, round and round until the layout
unmounted. It now takes `hasToken === true`.

**Two date helpers were dead code.** `formatSchoolDate` and `schoolDateOf`
were written for the feed and never called, so every row said "tapped in at
7:56 AM" with no day — fine for this morning, useless for last Tuesday. Rows
not from today now name their day, on the school's calendar: a tap at 00:30 in
Balanga belongs to that day, not to the previous one in UTC, and there is a
test for exactly that.

Also: `statusLabel` was narrowed to `Pick<Today, "status" | "flexible">`, since
those are the only two fields it reads — the child-day screen had been
inventing null times and a tap count to satisfy a type it didn't need.

### The tab bar had no icons

The owner's first run showed two broken glyphs where the tab icons belong.
Cause: `tabBarIcon` was never set, so React Navigation fell back to something
that did not resolve on the device.

Drawn rather than installed. `react-native-svg` is already here for the logo,
and two shapes — a house and a bell — do not justify an icon-font package:
those ship whole typefaces, and every one lands in the APK a parent downloads
over mobile data. They take the tint React Navigation hands them, so the
active and inactive colours still come from `src/theme`, and both are hidden
from screen readers because the tab already has a label.

The badge itself was fine and stayed as it was. Its contrast was measured
rather than assumed: 8.42:1 in dark and 6.10:1 in light, both well past AA.
