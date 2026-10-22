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

**Expo Go can't receive push notifications** (`docs/LEARNING-LOG.md`). That's
M7's job and needs a development build.

## 3. The checks

Run all four before saying a step is done. CI runs the same four on every push.

```powershell
npm run lint             # ESLint, Expo's config
npm run typecheck        # TypeScript, no output means no errors
npm run check:colors     # fails if a colour is written outside src/theme
npm test                 # Jest
```

While building one thing, a single file is quicker:

```powershell
npm test -- src/theme/contrast.test.ts
npm test -- --watch
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

## 6. Later steps

Push, development builds and the installable APK arrive in M7 and M8. Their
commands get added here then.
