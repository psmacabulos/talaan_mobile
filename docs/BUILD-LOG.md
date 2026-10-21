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
