# Step M7c — The Bantay Aral logo on every push

A reproducible checklist, written from the real diff.

**What you end with:** a push shows the Bantay Aral mark, white in a circle of
the mark's blue, instead of Expo's "^". The words don't change: those are the
server's (`docs/API-REQUESTS.md`, item 5).

```
design/logo/notification-icon.png ──cp──► assets/images/notification-icon.png
                                                  │
app.config.ts  ["expo-notifications", { icon, color: "#1149A6" }]
                                                  │  EAS build
                                                  ▼
AndroidManifest: default_notification_icon, default_notification_color
                                                  │
push arrives ─► expo-notifications setSmallIcon(...) ─► the mark in a blue circle
```

## 1. The icon file

```bash
cp design/logo/notification-icon.png assets/images/notification-icon.png
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/notification-icon.png
```

Expect 96 × 96, `hasAlpha: yes`, 1,823 bytes. It must be white on
transparent: Android uses only the shape. Keep the shape about 8 px from each
edge so Android 12's circle doesn't clip it (this one: 73 × 71, centred).

## 2. `app.config.ts`

Beside the other written-out constants (P-002: the config can't import `src/`):

```ts
/**
 * The circle behind the push icon (on older Android, the app's name too): the
 * mark's deep blue, src/theme/colors.ts brand.light.parent.
 */
const NOTIFICATION_COLOR = "#1149A6";
```

The plugin entry, replacing the bare `"expo-notifications"`:

```ts
// Android draws a push's icon in one colour, from its shape alone, so the
// icon is the mark as a white outline. No large icon: it would show the
// mark a second time (docs/PUSH.md, "What a push looks like").
[
  "expo-notifications",
  {
    icon: "./assets/images/notification-icon.png",
    color: NOTIFICATION_COLOR,
  },
],
```

Check what Android will get:

```bash
npx expo config --type introspect | grep default_notification
```

## 3. `app.config.test.ts`

- A helper `notificationsPlugin()` that finds the `["expo-notifications", …]`
  entry. The existing test checks it's defined (it used `toContain` on the
  bare string, which no longer matches).
- A new test: the entry equals `{ icon, color: brand.light.parent }`, so the
  colour can't drift from `src/theme`, and
  `jest.requireActual("./assets/images/notification-icon.png")` doesn't throw,
  so a wrong path fails `npm test` instead of the EAS build. Not
  `fs.existsSync`: no Node types in this project (`docs/BUILD-LOG.md`, M7c).

## 4. Checks, then the build

```bash
npm run lint
npm run typecheck
npm run check:colors
npm test                      # 27 suites, 325 tests
eas build --profile development --platform android
```

Install the new APK over the old one, `npx expo start --dev-client --clear`,
then the table in `docs/PLAN.md`, Step M7c.

## Not done here

- No `largeIcon` (owner's choice A). `design/logo/notification-large-icon.png`
  is ready if that changes.
- The app icon and splash are still Expo's: M8.
