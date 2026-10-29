# Commands

Everything you need to run, grouped by what you're trying to do. Run them from
the project folder.

## 1. Set up the machine

You need **Node 24.3 or newer** (SDK 58's floor, and the same major the backend
uses). `.nvmrc` pins the exact version this project was built with.

```powershell
nvm install 24.11.0
nvm use 24.11.0          # Administrator PowerShell: it rewrites a system link
node -v                  # expect v24.11.0
```

`nvm install` downloads a version; it does **not** switch to it. If `node -v`
still shows the old version, the switch didn't get admin rights
(`docs/LEARNING-LOG.md`, "nvm installs a Node version without switching to it").

```powershell
npm install              # install the project's packages
```

## 2. Run the app on your phone

```powershell
npx expo start           # then scan the QR code with Expo Go
npx expo start --clear   # same, but throws away the bundler's cache
```

**Expo Go must match the SDK.** Each Expo Go build supports exactly one SDK,
and the Play Store copy lags a new SDK release by days or weeks. If the phone
says "Project is incompatible with this version of Expo Go", install the
matching build by hand (`docs/PROBLEMS-LOG.md`, P-005):

```
https://api.expo.dev/v2/versions/latest    # lists the APK for every SDK
```

This project is on SDK 58, whose Expo Go is
`Expo-Go-58.0.5.apk`. Download it on the phone, open it, and allow installing
from that app when Android asks.

**Android only.** `app.config.ts` declares `platforms: ["android", "ios"]`.
Pressing `w` for a web preview is not supported (P-006).

Use `--clear` after anything that changes packages or `app.config.ts`.
Environment variables are read when the bundle is built, so `.env` changes need
it too.

The phone and the computer must be on the same Wi-Fi. If the QR code times out,
it's almost always Windows Firewall blocking Node — allow it on private
networks.

**Expo Go can't receive push notifications** (`docs/LEARNING-LOG.md`). Since
M7 the app runs as a development build instead.

## 2a. The development build (since M7)

The **Bantay Aral** app on the phone, installed from an EAS build, replaces
Expo Go. It loads the code from the laptop the same way.

```bash
npx expo start --dev-client --clear   # then open Bantay Aral on the phone, not Expo Go
```

Since `expo-dev-client` is installed, plain `npx expo start` assumes the
development build too. Press `s` in the terminal to switch to Expo Go.

**When you need a new build** (15 a month on the free plan): only after a
native change, meaning a new package with native code, or anything in
`app.config.ts`. Code changes in `src/` never need one.

```bash
eas build --profile development --platform android   # builds on Expo's servers, 10–20 min
```

It asks "Install and run the Android build on an emulator?": answer **n**.
Open the link it prints on the phone, download the APK, install it.

| Push setup | Command |
|---|---|
| See what EAS will build with | `eas config --platform android --profile development` |
| See the uploaded files and variables | `eas env:list --environment development` |
| Upload `google-services.json` again (after changing Firebase) | `eas env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development --environment preview --environment production` |
| See or change the Firebase key Expo sends with | `eas credentials` → Android → development |

## 2b. Make the demo APK (since M8)

The demo build is the release kind: all the code is inside it, so it runs on
any phone with no laptop, and it talks to `https://bantayaral.com` (set in
`eas.json`'s `preview` profile, not `.env`). What it's for and how it differs
from the development build: `docs/LEARNING-LOG.md`, "The development build
and the demo build".

```bash
eas env:list --environment preview                   # should list GOOGLE_SERVICES_JSON
eas config --platform android --profile preview      # should show the preview profile, buildType apk
eas build --profile preview --platform android       # 1 of the 15 a month, 10–20 min on Expo's servers
```

It may ask "Install and run the Android build on an emulator?": answer **n**.
When it finishes it prints a link. On the phone:

1. Uninstall the development build first (long-press its icon → Uninstall).
   Both are `com.bantayaral.parent`, so they can't sit side by side.
2. Open the link, download the APK, install it (allow installs from the
   browser; Play Protect → **Install anyway**).
3. Run `docs/DEMO.md`.

To develop again: uninstall the demo APK, reinstall the development build
(expo.dev → the project → Builds → the latest `development` build), then
`npx expo start --dev-client --clear`.

## 3. The checks

Run all four before saying a step is done. CI runs the same four on every push.

```powershell
npm run lint             # ESLint, Expo's config
npm run typecheck        # TypeScript, no output means no errors
npm run check:colors     # fails if a colour is written outside src/theme
npm test                 # Jest
```

What "passed" looks like:

| Command | Passed | Failed |
|---|---|---|
| `npm run lint` | Only the `> expo lint` and `env:` lines, nothing after | Lines with `error` or `warning`, a file name and a line number |
| `npm run typecheck` | Only the `> tsc --noEmit` line, nothing after | `src/…ts(12,5): error TS…` |
| `npm run check:colors` | `No colours outside src/theme.` | The file and line holding a colour |
| `npm test` | `Test Suites: N passed, N total` and `Tests: N passed, N total` at the end | `failed` in those lines, with a `●` and the test's name above |

While building one thing, a single file or folder is quicker:

```powershell
npm test -- src/theme/contrast.test.ts   # one file
npm test -- src/push                     # every test in a folder
npm test -- --watch                      # re-runs as you save
```

## 4. Look at the resolved config

`app.config.ts` is TypeScript, so what Expo actually reads is worth checking
after you change it:

```powershell
npx expo config --type public
```

Expect `name: 'Bantay Aral'`, `package: 'com.bantayaral.parent'`, and
`scheme: 'bantayaral'`.

## 5. Troubleshooting

| What you see | What to do |
|---|---|
| `Cannot find module './src/...'` from an Expo command | `app.config.ts` is importing from `src/`. It can't (`docs/PROBLEMS-LOG.md`, P-002) |
| `ERESOLVE` on install | A peer version conflict. Don't reach for `--legacy-peer-deps`; read which two packages disagree (P-001) |
| An install that takes minutes | The repository is inside OneDrive (P-003) |
| "Server not reached" on the sign-in screen | Check `EXPO_PUBLIC_API_URL` in `.env`. The address in `docs/SERVER.md` is dead; use `https://bantayaral.com` (P-007) |
| A change to `.env` seems ignored | Environment variables are baked in at bundle time: `npx expo start --clear` |
| The app loads but text looks wrong | A font didn't load. The splash is hidden either way on purpose, so check the Metro log for a font error |
| A change doesn't show up | `npx expo start --clear` |

## 5a. Add a picture to the app

Shrink it first, to 3 times the largest size it's drawn at (`CLAUDE.md`,
"Images are sized for how they're shown"). `sips` comes with macOS; nothing to
install.

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/<file>.png   # its size now, and whether it keeps transparency
sips -Z 360 assets/images/<file>.png                                     # longest side to 360 pixels, overwriting the file
ls -l assets/images/<file>.png                                           # the size on disk, before and after
```

`-Z` keeps the shape: a 1536 × 1024 picture becomes 360 × 240. Shrink from the
original each time, never from a copy already shrunk. If it's committed, git
still has it: `git show HEAD:assets/images/<file>.png > ~/Desktop/original.png`.
Then check it on the phone, in light and dark.

## 6. Later steps

Push and the development build are in 2a, the demo APK in 2b.

## 7. Run the checks the way CI runs them

CI checks out a clean tree, so it does **not** have the files Expo generates
and gitignores — `expo-env.d.ts` and `.expo/`. Without them TypeScript sees a
different set of globals, which once let three steps pass locally while every
push was failing (`docs/PROBLEMS-LOG.md`, P-010).

To reproduce CI exactly, move both aside and run all four:

```bash
mv expo-env.d.ts /tmp/ && mv .expo /tmp/dot-expo
npm run lint && npm run typecheck && npm run check:colors && npm test
mv /tmp/expo-env.d.ts . && mv /tmp/dot-expo .expo
```

Expo recreates both the next time `npx expo start` runs, so nothing is lost if
you forget to move them back.

**Then look at the Actions tab.** Green locally is not green in CI.

## 8. Refuse a commit that would fail CI

`.githooks/pre-commit` runs the same four checks CI runs and refuses the commit
if any fails. **Turn it on once per clone:**

```bash
git config core.hooksPath .githooks
```

That is all. It takes about 40 seconds, which is deliberate — this project
commits once per step, not once a minute.

In a genuine emergency:

```bash
git commit --no-verify
```

Skipping means CI is the only thing checking, so look at the Actions tab.

**Why it exists:** CI was red for three steps while every check passed locally,
because nobody looked at the Actions tab (`docs/PROBLEMS-LOG.md`, P-010). A red
build found a minute after committing is an annoyance; one found three steps
later is an afternoon.

**It is not a replacement for CI.** The hook runs on your machine, with your
`node_modules` and your generated files. CI starts from a clean clone, which is
how P-010 happened in the first place. Section 7 above reproduces that.
