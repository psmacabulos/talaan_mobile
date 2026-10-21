# Problems log

Every problem hit, while building or with the live app. Newest last. Each is
numbered `P-NNN` so other docs can point at it.

---

## P-001 — npm can't resolve react-dom after trimming the template

- **Date:** 2026-10-21
- **Where:** M1, installing `@expo-google-fonts/*`
- **Tag:** Other
- **Status:** Fixed

**Symptom**

```
npm error code ERESOLVE
npm error While resolving: react-dom@19.3.1
npm error Found: react@19.3.0
npm error Could not resolve dependency:
npm error peer react@"^19.3.1" from react-dom@19.3.1
```

**Cause**

The Expo template ships `react-dom` and `react-native-web` pinned to the same
versions as `react`. Being Android-first, I removed both as unused. They are
not unused: `expo-router` pulls `react-dom` in transitively through its
`@radix-ui/*` dependencies. With no pin in `package.json`, npm resolved it to
the newest `react-dom` (19.3.1), which demands `react@^19.3.1`, while Expo
pins `react` at 19.3.0. Nothing could satisfy both.

**Options weighed**

1. `--legacy-peer-deps` — hides the conflict rather than fixing it, and leaves
   a tree that behaves differently from CI's.
2. Upgrade `react` to 19.3.1 — fights Expo's own pin; the SDK chooses React.
3. Put `react-dom` and `react-native-web` back at the template's versions.

**Solution**

Option 3. Both are back at the template's versions. They add nothing to the
Android APK (they are only used when building for web), so the only cost is
disk. The lesson: the template's pins are load-bearing even for packages the
app never imports.

---

## P-002 — app.config.ts can't import from src/

- **Date:** 2026-10-21
- **Where:** M1, `npx expo install`
- **Tag:** Other
- **Status:** Fixed

**Symptom**

Every Expo command failed, including unrelated ones like `expo install`:

```
Error: Cannot find module './src/product'
Require stack:
- .../talaan_mobile/app.config.js
```

Note `app.config.js` — a file that doesn't exist in the repository.

**Cause**

`app.config.ts` had `import { APP_ID, PRODUCT_NAME } from "./src/product"` so
that the package id and the splash colour came from one place. Expo transpiles
`app.config.ts` into standalone CommonJS (the `app.config.js` in the error) and
loads it with plain `require`, outside TypeScript's resolution. `require("./src/product")`
then looks for `src/product.js`, which doesn't exist, and the config throws.
Because every Expo command loads the config first, this broke all of them.

**Options weighed**

1. Point the import at a `.js` constants file both sides can read — works, but
   splits the theme across two languages for one value.
2. Write the values out in `app.config.ts` and accept the duplication.
3. Write them out, and add a test that fails if the copies ever disagree.

**Solution**

Option 3. `app.config.ts` now imports nothing, and `app.config.test.ts` asserts
its name, package id, bundle id, scheme and icon background against
`src/product.ts` and `src/theme/colors.ts`. `scripts/check-color-literals.mjs`
no longer scans the config, since the test covers it instead.

This matters more than it looks: the package id is permanent once published,
and M7 registers it with Firebase. Two copies silently drifting apart would
break push on every phone with no obvious cause.

---

## P-003 — npm install takes minutes because the repository is inside OneDrive

- **Date:** 2026-10-21
- **Where:** M1, every `npm install`
- **Tag:** Performance
- **Status:** Open — needs the owner's decision

**Symptom**

No error. Installs simply don't finish:

| Command | Time |
|---|---|
| `npm install` (first, ~900 packages) | over 10 minutes |
| `npm install --save-dev` (3 packages) | over 9 minutes |
| The same on a normal folder | seconds to ~1 minute |

**Impact**

Every install, and every `npx expo start --clear`, costs minutes instead of
seconds. It will get worse: M2 adds TanStack Query and Zod, M7 adds
expo-notifications, and each is another full-tree write. It also risks more
than time — OneDrive can hold a lock on a file npm is replacing, which shows
up as a random `EPERM` or `EBUSY` mid-install, and a half-written
`node_modules` is hard to tell apart from a real dependency problem.

**Cause**

The repository lives at `C:\Users\mikem\OneDrive\Desktop\personal\with kuya pat\talaan_mobile`.
`node_modules` is tens of thousands of small files. OneDrive watches the folder
and tries to sync each one as it appears, so every file write pays sync
overhead. The folder name also contains spaces, which some native build tools
on Windows handle badly — worth avoiding before M7 touches Android builds.

**Options weighed**

1. Leave it — every step pays the cost, and M7's build tooling is the least
   forgiving part of the plan.
2. Exclude the folder from syncing in OneDrive's settings — helps, but it is a
   per-machine setting that is easy to lose, and the spaces in the path remain.
3. Move the repository outside OneDrive, for example `C:\dev\talaan_mobile`.
   Git keeps the history; OneDrive is not the backup here, GitHub is.

**Solution**

Proposed: option 3, before M2. Not done yet — moving the owner's folder is
their call, not mine.

**It already caused a corrupt install (2026-10-21)**

`@testing-library/react-native` installed into a directory with `dist/`,
`docs/`, `README.md` and `matchers.d.ts` — but **no `package.json`**. npm
reported success. The failure surfaced several steps later as a confusing
TypeScript error:

```
src/app/index.test.tsx(6,32): error TS2307: Cannot find module
'@testing-library/react-native' or its corresponding type declarations.
```

which reads like a missing dependency, not a half-written one. `npm ls` would
also have called it present. Fixed by deleting
`node_modules/@testing-library` and installing again.

This is the risk in the Impact section happening for real, on the first day of
the project. It is the strongest argument for moving the repository: a
corrupt install that reports success costs far more to diagnose than a slow one.

**Two more corrupt packages, same afternoon (2026-10-21)**

| Package | How it presented | Real cause |
|---|---|---|
| lodash | `Module jest-expo should have "jest-preset.js" ... at the root` — but the file was there | jest-expo's preset requires lodash; lodash was missing its internal `./stubFalse` |
| `@typescript-eslint/scope-manager` | `npm run lint` dying in a stack trace through eslint-config-expo | missing its internal `./analyze` |

Four corrupt packages in one step, each presenting as a different and
misleading error — a Jest config problem, a missing dependency, an ESLint
plugin failure. None of them was what it looked like. Every one was fixed by
deleting the folder and running `npm install` again.

---

## P-004 — a test file inside src/app became a route, and shipped in the app

- **Date:** 2026-10-21
- **Where:** M1, `npx expo export --platform android`
- **Tag:** Performance
- **Status:** Fixed

**Symptom**

The four checks all passed, but exporting the Android bundle listed this:

```
 src\app\index.test.tsx
 | import "@testing-library/react-native"

 src\app (require.context)
```

The test file, and the whole testing library behind it, were being pulled into
the app a parent would install.

**Impact**

`@testing-library/react-native` and its dependencies in the shipped bundle: a
bigger download for parents on mobile data, for code that can never run. Worse,
Expo Router would have served the test file as a **navigable route**. Nothing
linked to it, but it was reachable.

**Cause**

Expo Router builds its routes from a `require.context` over the app directory,
and its pattern excludes almost nothing:

```js
/^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)|(?:\+middleware)))\.[tj]sx?$).*(?:\.ios|\.web)?\.[tj]sx?$/
```

Only `+api`, `+html` and `+middleware` are skipped. There is no exception for
`.test.`, `.spec.` or `__tests__`. **Every** `.ts`/`.tsx` file under `src/app`
is a route.

Putting a test beside the screen it tests is normal practice, and it is the
wrong practice here. Neither lint, typecheck nor Jest can see the problem —
only an export shows it.

**Options weighed**

1. Add a Metro or router config to ignore test files — more configuration to
   maintain, and it fights the framework's own convention.
2. Rename to something the pattern skips — relies on an undocumented quirk.
3. Keep `src/app` for routes only, and put tests anywhere else.

**Solution**

Option 3. `src/app/index.test.tsx` moved to
`src/__tests__/sign-in-screen.test.tsx`, importing the screen through the `@/`
alias. Re-exported to confirm the import chain is gone.

**The rule for later steps:** colocate tests freely, anywhere except `src/app`.
`src/theme/contrast.test.ts` sitting beside its code is fine. And run
`npx expo export --platform android` before calling a step done — it is the
only check that catches this.

---

## P-005 — "Project is incompatible with this version of Expo Go"

- **Date:** 2026-10-21
- **Where:** M1, first run on the owner's Android phone
- **Tag:** Other
- **Status:** Fixed, by installing the matching Expo Go

**Symptom**

```
ERROR  Project is incompatible with this version of Expo Go
```

**Cause**

Each Expo Go build supports **exactly one** SDK, and the Play Store copy was
still on SDK 57 while this project is on SDK 58.

The SDK choice was made on the reasoning that Expo Go auto-updates to the
newest SDK, so an SDK 57 project would be the one refused. That is true in the
steady state and wrong right after a release: the store build lags the SDK by
days or weeks while Google and Apple review it. SDK 58 shipped on 2026-10-15,
and the SDK 58 Expo Go had not reached the Play Store by 2026-10-21. So for
this window it is **SDK 58 that Expo Go refuses**, the exact opposite of the
prediction.

The error text makes it worse by implying the project is at fault. It isn't;
the store build simply doesn't exist yet.

**Options weighed**

1. Downgrade to SDK 57 — works today, then breaks in a few weeks when the
   store build moves to 58, probably mid-step.
2. Jump to a development build now — immune to all of this, but it drags M7's
   Firebase and EAS setup to the start of the project.
3. Install the SDK 58 Expo Go directly. Expo publishes a signed APK per SDK,
   listed at `https://api.expo.dev/v2/versions/latest`.

**Solution**

Option 3. Verified live (226 MB, `application/vnd.android.package-archive`):

```
https://github.com/expo/expo-go-releases/releases/download/Expo-Go-58.0.5/Expo-Go-58.0.5.apk
```

Installing it by hand sidesteps the store lag entirely and keeps the project on
the SDK `CLAUDE.md` asks for. It's the same sideloading the demo build will use
in M8, so it's a useful rehearsal rather than a detour.

**For later:** at every SDK release, check
`https://api.expo.dev/v2/versions/latest` before assuming the store copy has
caught up. From M7 onward this stops mattering: a development build carries its
own runtime and never consults Expo Go.

---

## P-006 — the logo crashes react-native-svg's web renderer

- **Date:** 2026-10-21
- **Where:** M1, after pressing `w` in the Expo CLI
- **Tag:** Other
- **Status:** Closed — web is not a target

**Symptom**

```
Web  ERROR
  react-native-svg/lib/module/web/WebShape.js:74
  render (WebShape.js:74:25)
  BantayAralMark (src/components/brand/bantay-aral-mark.tsx:36:5)
```

**Cause**

`WebShape.js` is react-native-svg's **web** implementation, reached only when
the project is opened in a browser. The mark renders correctly on Android; the
failure is in react-native-svg's web path under React Native 0.88 and
react-native-web 0.21.4. `unstable_createElement` was ruled out as the cause —
react-native-web 0.21.4 still exports it.

**Solution**

Not fixed, by decision. Web has never been a target: `CLAUDE.md` says Android
first with iOS later from the same code, and web appears nowhere in
`docs/PLAN.md`. Chasing a renderer bug on a platform nothing will ship to is
work with no payoff.

`app.config.ts` now declares `platforms: ["android", "ios"]`, so pressing `w`
gives a clear "not configured" message instead of a crash, and
`app.config.test.ts` keeps it that way. If web is ever wanted, this is the
entry in the log to reopen.
