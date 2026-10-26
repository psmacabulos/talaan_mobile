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

---

## P-007 — the live server moved, and the docs still name the old one

- **Date:** 2026-10-21
- **Where:** M2, checking `GET /schools` against the live server
- **Tag:** Other
- **Status:** Open — needs the owner to confirm

**Symptom**

```
$ curl https://bantayaral.herokuapp.com/api/v1/parents/schools
HTTP 404   <iframe src="https://www.herokucdn.com/error-pages/no-such-app.html">
```

"No such app" means the Heroku application does not exist — not that it is
asleep, or that the path is wrong.

**What does answer**

```
$ curl https://bantayaral.com/api/v1/health
{"ok":true,"database":"ok"}

$ curl https://bantayaral.com/api/v1/parents/schools
{"schools":[{"id":"school-balanga","name":"Balanga City National Science High School"},
            {"id":"school-crimsonridge","name":"Crimson Ridge National High School"},
            {"id":"school-oceanview","name":"Oceanview National High School"}]}
```

The whole parent API is live at `https://bantayaral.com`, with the same three
schools `docs/SERVER.md` describes as the demo data. The answer was checked
against this app's own Zod schema and matches exactly.

**Impact**

Anyone following the docs sets `EXPO_PUBLIC_API_URL` to the Heroku address and
gets the "no answer at all" path on every screen — which looks exactly like a
bug in this app rather than a wrong address.

**Cause**

Unknown from this side. Most likely Talaan moved to its own domain and these
docs weren't copied again (`mobile/README.md`, "Keeping it current"). The
address appears in `docs/SERVER.md`, `docs/PLAN.md` and `README.md`.

**Solution**

`.env.example` now points at `https://bantayaral.com`, which is verified
working, with a comment explaining why it differs from `docs/SERVER.md`.

`docs/SERVER.md` and `docs/PLAN.md` are **not** changed yet: `docs/SERVER.md`
says to ask the owner whether a deploy is current before changing anything
here, and the hosting is theirs to describe. Once they confirm, the address
should be corrected in both, and `mobile/starter/docs/SERVER.md` in the Talaan
repository too, so the next copy does not bring the dead address back.

**Also worth confirming:** whether `PUSH_SENDER` and `EXPO_ACCESS_TOKEN` are
set wherever the server now runs. M7 depends on them, and `docs/SERVER.md`
describes setting them with `heroku config:set`, which no longer applies.

---

## P-008 — a screen test started waiting on the network

- **Date:** 2026-10-22
- **Where:** M2, `npm test` on the owner's machine
- **Tag:** Other
- **Status:** Fixed

**Symptom**

```
● the sign-in screen › shows the heading and what the app is for
  thrown: "Exceeded timeout of 5000 ms for a test."
Tests: 1 failed, 75 passed, 76 total
Time: 57.006 s
```

The same suite passed on another machine minutes earlier, in nine seconds.

**Cause**

M2 added `<ServerCheck />` to the sign-in screen, and it calls `getSchools()`
on mount. `src/__tests__/sign-in-screen.test.tsx` mocked nothing, so rendering
the screen in a test made a **real HTTPS request** to the live server. The test
then raced the connection: fast enough and it passes, slow enough and Jest's
five-second limit fires.

The 57-second run against a 9-second one is the tell — almost all of it was
waiting on a socket.

The failure also points at the wrong thing. It names the heading assertion,
which is fine; the problem is three lines above, in a component the test never
mentions.

**Impact**

Flaky on any slow connection, and guaranteed to fail offline or in CI if the
server is unreachable — a red build that says nothing about the code.

**Options weighed**

1. Raise the Jest timeout — hides it, keeps the network dependency, still fails
   offline.
2. Guard `ServerCheck` so it does nothing under test — spreads test awareness
   into app code.
3. Mock the API module in the screen test.

**Solution**

Option 3:

```ts
jest.mock("@/api/endpoints", () => ({
  getSchools: jest.fn().mockResolvedValue([]),
}));
```

The run dropped back to 14 seconds. Both test files now mock everything that
would reach the network.

**The rule:** a test never touches the network. When a step adds a component
that calls the API, every test that renders a screen containing it needs the
mock — which is a reason to keep API calls out of shared screen furniture.

---

## P-009 — signing out hung on "Checking your sign-in…" for ever

- **Date:** 2026-10-22
- **Where:** M3, on the owner's phone
- **Tag:** Other
- **Status:** Fixed

**Symptom**

Pressing **Sign out** on the signed-in screen did nothing visible. The screen
replaced the parent's name with a spinner and "Checking your sign-in…", kept
the Sign out button, and stayed that way indefinitely. No error, no crash, no
way back. Every check had passed and 109 tests were green.

**Cause — two bugs stacked, and either alone would have been survivable**

**1. `queryClient.clear()` orphans the observers watching it.** `hasToken`
lived in the query cache. Signing out did:

```ts
await clearToken();
queryClient.clear();
queryClient.setQueryData(HAS_TOKEN_KEY, false);
```

`clear()` destroys every query, including the one the gate's `useQuery` was
attached to. The `setQueryData` afterwards builds a **new** query object that
the now-orphaned observer is not watching. So the gate was never told the
token had gone, and never moved the parent to sign-in.

The deeper mistake was putting it there at all. TanStack Query looks after
*server* state — answers that go stale, get refetched, get retried. "Is there
a token on this phone" is none of those things. It is local state, and it now
lives in React state (`src/auth/session-context.tsx`), where clearing the
cache cannot touch it.

**2. A disabled query reports `isPending: true` for ever.** The screen read:

```tsx
{me.isPending ? <Checking /> : me.isError ? <Error /> : <Name />}
```

`useMe` is `enabled` only when there is a token. The instant `hasToken` went
false the query was disabled — and in React Query v5 a disabled query has
`status: "pending"` with `fetchStatus: "idle"`, so `isPending` stays true with
nothing in flight. That is the spinner in the screenshot. `isLoading`
(`isPending && isFetching`) is the "really loading" flag; the screen now
branches on `me.data` instead, which also narrows the type.

Bug 1 stranded the parent on the screen. Bug 2 decided what they stared at.

**Why the tests missed it**

Every test rendered one screen in isolation. Nothing exercised *sign out* with
a real `SessionProvider` and a cleared cache, which is the only place the two
met. `src/auth/__tests__/session.test.tsx` now does exactly that: it watches
what the gate watches and fails if `hasToken` ever stops reaching a listener
after a sign-out.

**The lesson worth carrying to M4–M7:** state that decides *navigation* must
not live anywhere that a cleanup routine can wipe out from underneath its
listeners. And `isPending` is not "loading" when a query can be disabled.

---

## P-010 — CI had been failing since M2, and the checks passed locally

- **Date:** 2026-10-25
- **Where:** GitHub Actions, every push from M2 onward
- **Tag:** Other
- **Status:** Fixed

**Symptom**

CI run #1 (M1) passed. #2 (M2) and #3 (M3) both failed, with one error:

```
src/api/config.ts(50,3): error TS2322:
  Type 'string | undefined' is not assignable to type 'string'.
```

The same `npm run typecheck` passed on the developer's machine every time.
The failure was found by someone looking at the Actions tab, not by anything
in the workflow we were running.

**Cause**

`expo-env.d.ts` sits at the project root, contains one line —
`/// <reference types="expo/types" />` — and is **generated by Expo and
gitignored by Expo's own template**. So it exists on a developer's machine and
never exists in CI.

`tsconfig.json` sets `"types": ["jest"]`, which switches off automatic
inclusion of every other `@types` package. That makes the one reference in
`expo-env.d.ts` the only route to Expo's global types, so the two environments
typecheck against **different sets of globals**, and `getBaseUrl` narrowed in
one and not the other:

```ts
let cached: string | undefined;
// …
cached = raw.replace(/\/+$/, "");
return cached;   // string here, string | undefined in CI
```

Isolated by hiding each generated file in turn: `.expo/` makes no difference,
`expo-env.d.ts` reproduces the failure exactly.

**Two fixes, because there were two faults**

1. **The divergence.** `src/types/expo.d.ts` is committed and carries the same
   reference, so CI and a laptop now check the same globals.
2. **The fragile line.** `getBaseUrl` keeps the value in a `const` and returns
   that, instead of depending on TypeScript narrowing a module-level `let`.

**The real lesson**

Green checks locally were reported as "the checks pass" for three steps
running, while the pipeline meant to be the backstop was red the whole time.
A check that only ever runs in one environment is not a check — and nobody had
looked at the Actions tab.

Worth repeating before each report: run the checks the way CI runs them. The
command that reproduces it is to move `expo-env.d.ts` and `.expo/` aside and
run all four.

**Still different in CI, knowingly:** `.expo/types/router.d.ts` is generated by
the dev server and is not committed, so **typed routes are not verified in
CI**. A mistyped `router.push("/hom")` fails on a developer's machine and
passes the pipeline. Left as is for now; if it ever bites, commit the file or
generate it in the workflow.

---

## P-011 — "Link a child" flickered and did nothing

- **Date:** 2026-10-26
- **Where:** M6, on the owner's phone, after the tab bar was added
- **Tag:** Other
- **Status:** Fixed

**Symptom**

Tapping **Link a child** on Home made the screen flicker, as if it had
refreshed, and stayed on Home. No error, nothing in the log. Tapping a child's
card had the same problem. Both had worked in M4 and M5.

**Cause**

M6 turned `src/app/(app)/_layout.tsx` into a `<Tabs>`. That made **every**
file under `(app)` a tab screen — including `link-child.tsx` and
`child/[id].tsx`, which are not tabs. They were hidden from the bar with:

```tsx
<Tabs.Screen name="link-child" options={{ href: null }} />
```

`href: null` does not mean "hidden but still reachable". It takes the screen
out of the navigator's reachable set, so `router.push("/link-child")` had
nowhere to go. The flicker was the navigation attempt failing.

Before M6 there was no `(app)/_layout.tsx` at all, so these were screens on the
root **stack** and pushing them worked. Adding tabs silently changed what they
were.

**Options weighed**

1. Drop `href: null` — the detail screens would appear in the tab bar, which
   is wrong: "Link a child" is not a destination a parent lives in.
2. Move them out of `(app)` — they would lose the signed-in gate.
3. Put a stack above the tabs, which is the ordinary shape for this.

**Solution**

Option 3, and it is what should have been built in M6:

```
src/app/(app)/_layout.tsx          Stack
src/app/(app)/(tabs)/_layout.tsx   Tabs — Home, Notifications
src/app/(app)/(tabs)/home.tsx
src/app/(app)/(tabs)/notifications.tsx
src/app/(app)/link-child.tsx       pushed over the tabs
src/app/(app)/child/[id].tsx       pushed over the tabs
```

A `(tabs)` group adds no path segment, so `/home`, `/notifications`,
`/link-child` and `/child/[id]` are all unchanged, and the gate in
`src/app/_layout.tsx` still matches on `segments[0] === "(app)"`.

**Why nothing caught it.** Lint, types, 178 tests and the Android export all
passed throughout — a route that exists but cannot be reached is still a valid
route. Only tapping the button on a phone shows it. The rule in
`docs/PLAN.md` — that a step is not done until every row of its "Check it on
the phone" table passes — exists for exactly this, and M6's table had a row
for tapping a child's card that had not been run yet.

**The lesson:** a detail screen is not a tab. Tabs are where a parent lives;
everything else is pushed over them.

## P-012 — a child who left and came back looked as if they never moved

- **Date:** 2026-10-26
- **Where:** M5's child card on Home, found by the owner on the live server
- **Tag:** Other
- **Status:** Fixed in M6.1, waiting for the owner's phone check

**Symptom**

A real child had 13 taps today, the last a time in at 7:05 PM. Their card
said only "Time in 11:09 AM" and "Time out —", which is exactly what a child
who arrived and never moved looks like.

**Cause**

The card showed `timeIn` and `timeOut`. The server's `timeOut` is the last tap
**only when that tap is a time out**, so after in, out, in it is `null`. The
card had nothing else to show: the API sent no newest tap.

**Options weighed**

1. Work out the latest tap in the app from `GET /children/:id/taps`. Rejected:
   one more request per child on every Home load, and the app would be deciding
   which tap counts as what, which is the server's job (CLAUDE.md, "The backend
   is somewhere else").
2. Ask the server for the newest tap and its kind. Talaan Step 59.3 added
   `today.latest: { at, kind } | null`.

**Solution**

Option 2. The card shows the time in, then, from the second tap on, "Out 4:05
PM" or "Back in 7:05 PM" (`latestTapWords` in `src/children/status-words.ts`).
The separate "Time out" goes. A server without `latest` gets the old time in
and time out pair, and a `latest` the app can't read is dropped on its own
rather than losing the child's whole card (`.catch(undefined)` in
`src/api/schemas.ts`).

## P-013 — "another parent linked your child" notices are dropped from the feed

- **Date:** 2026-10-26
- **Where:** the feed (M6), found while copying the fresh contract for M6.1
- **Tag:** Security
- **Impact:** a parent is never told in the app that another account linked
  their child, which is the one notice meant to catch a stranger doing it. The
  unread badge also counts a notice the parent can never see or clear.
- **Status:** Open, to be fixed in M6.2 (feed) and M7 (push)

**Symptom**

No error. Talaan Step 55.2 sends feed items with `kind: "guardian_linked"`
(docs/TALAAN-API.md, "Notifications"). The app's feed simply doesn't show them,
while the tab's badge can say "1" with nothing unread in the list.

**Cause**

`notificationSchema.kind` in `src/api/schemas.ts` only accepts `"time_in"` and
`"time_out"`. The feed's list is read with `tolerantArray`, which drops any
item that fails its schema, so the notice is thrown away quietly. That is the
behaviour we wanted for a broken item, and the wrong one for a new kind. The
`unreadCount` comes from the server, which does count it.

```
Talaan                                  This app
──────                                  ────────
Ana links Juan  ──► feed item           GET /notifications
                    kind: guardian_linked ──► notificationSchema: kind ∉ {in, out}
                                              └► tolerantArray drops it
                ──► unreadCount: 1      ──► badge "1", list empty
                ──► push "A new parent       (M7: must not read it as a tap)
                    account was linked
                    to Juan"
```

**Options weighed**

1. Accept any `kind` and show unknown ones as a tap. Rejected: the contract
   says never to show an unknown kind as a tap.
2. Add `guardian_linked`, with its optional `guardian`, and show it as its own
   kind of row with the contract's words. Keep dropping kinds still unknown.

**Solution**

Option 2, planned as Step M6.2 in `docs/PLAN.md`. Its push ("A new parent
account was linked to Juan") is handled in M7, which must open the feed and
never treat it as a tap.
