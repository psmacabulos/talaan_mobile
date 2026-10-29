# Step M8 — The demo build

A reproducible checklist, written from the real diff. The story, with the
splash dead end, is in `docs/BUILD-LOG.md`, "M8".

**What you end with:** an APK of the release kind, with the Bantay Aral icon
and splash, that runs on any Android phone without a laptop and talks to
`https://bantayaral.com`; and `docs/DEMO.md` to show it working.

```
design/logo/*.png ──cp──► assets/images/*.png ──► app.config.ts (icon, adaptiveIcon, splash)
                                                        │
eas.json "preview" (apk, EXPO_PUBLIC_API_URL) ──────────┤
EAS env "preview": GOOGLE_SERVICES_JSON (from M7) ──────┤
                                                        ▼
                         eas build --profile preview --platform android
                                                        │
                              link ─► phone (dev build uninstalled first) ─► docs/DEMO.md
```

No new package. One EAS build.

## 1. The pictures

```bash
for f in icon android-icon-foreground android-icon-background android-icon-monochrome; do
  cp design/logo/$f.png assets/images/$f.png
done
# The splash is the padded mark: Android 12+ shows it inside a circle.
cp design/logo/android-icon-foreground.png assets/images/splash-icon.png
sips -g pixelWidth -g pixelHeight assets/images/*.png
```

Expect every one 1024 × 1024. Don't use `design/logo/splash-icon.png`: its
mark fills 90% of the square and its corners fall outside the circle.

## 2. `app.config.ts`

The header comment's last paragraph:

```ts
 * The icon and splash are the Bantay Aral mark, copied from design/logo/ in
 * M8 (design/logo/README.md, "App icon and splash").
```

The splash plugin:

```ts
[
  "expo-splash-screen",
  // The mark with the adaptive icon's padding (the same picture as
  // android-icon-foreground.png): Android 12 and newer show the splash
  // inside a circle, which would cut the corners off a mark that fills
  // its square.
  {
    backgroundColor: ICON_BACKGROUND,
    image: "./assets/images/splash-icon.png",
    imageWidth: 200,
  },
],
```

## 3. `app.config.test.ts`

At the end of the `describe`:

```ts
test("every icon and splash picture the build reads exists (M8)", () => {
  const splash = appConfig.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  );
  const adaptive = appConfig.android?.adaptiveIcon;
  const pictures = [
    appConfig.icon,
    adaptive?.foregroundImage,
    adaptive?.backgroundImage,
    adaptive?.monochromeImage,
    Array.isArray(splash) ? splash[1].image : undefined,
  ];

  for (const picture of pictures) {
    expect(picture).toEqual(expect.stringMatching(/^\.\/assets\/images\//));
    // A wrong path would otherwise only show up as a failed EAS build.
    expect(() => jest.requireActual(picture as string)).not.toThrow();
  }
});
```

## 4. `eas.json`, the `preview` profile

Between `development` and `production`:

```json
"preview": {
  "distribution": "internal",
  "environment": "preview",
  "env": {
    "EXPO_PUBLIC_API_URL": "https://bantayaral.com"
  },
  "android": {
    "buildType": "apk"
  }
},
```

Why each: `internal` + `apk` make a file a phone installs by hand (an `.aab`
can't be); `environment: "preview"` picks up `GOOGLE_SERVICES_JSON`, uploaded
in M7; the address is here because EAS never sees the gitignored `.env`, and
it's public. Set it in one place only, not also as an EAS variable.

## 5. Build and install (the owner)

`docs/COMMANDS.md`, 2b:

```bash
eas env:list --environment preview
eas build --profile preview --platform android
```

Uninstall the development build, open the printed link on the phone, install.

## 5b. Forms above the keyboard (P-021)

Found while testing sign-up for the demo. Under Android's edge to edge the
window no longer shrinks for the keyboard, so each form needs to make room
itself.

```
SafeAreaView (top, bottom)
└─ KeyboardAvoidingView  behavior="padding", flex 1   ← padding = keyboard height
   └─ ScrollView         the forms' old contentContainerStyle
```

1. Create `src/components/form/form-screen.tsx`: `FormScreen({ centered,
   children })`, the tree above. `centered` sets
   `justifyContent: "center"`, as sign-in and sign-up had.
   The `KeyboardAvoidingView` goes **inside** `SafeAreaView`, so the padding
   doesn't count the navigation bar twice.
2. In `src/app/(auth)/sign-in.tsx` and `sign-up.tsx`, replace the
   `SafeAreaView` + `ScrollView` pair with `<FormScreen centered>`; in
   `src/app/(app)/link-child.tsx`, with `<FormScreen>`. Drop the now-unused
   `ScrollView` and `SafeAreaView` imports.
3. Test, `src/components/form/__tests__/form-screen.test.tsx`: fire a
   `layout` event on `testID="form-screen"` (it needs `persist: () => {}`),
   emit `keyboardWillShow` / `keyboardWillHide` through `DeviceEventEmitter`,
   and expect `paddingBottom` to follow. Check it fails with
   `enabled={false}`.
4. In `src/components/form/select-field.tsx` and `date-field.tsx`, call
   `Keyboard.dismiss()` before `setOpen(true)`, so the keyboard from the last
   text field doesn't stay up over the picker.

## 6. Docs

`docs/DEMO.md` (new: the two-part demo), `docs/SERVER.md` (Heroku → 
`bantayaral.com`), `docs/COMMANDS.md` 2b, `docs/PLAN.md` (M8 ticks and phone
checks; the old script replaced by a pointer), P-007 closed, P-021 added,
and a learning-log entry for the keyboard.

## 7. Check it

```bash
npm run lint
npm run typecheck
npm test
```

Then `docs/PLAN.md`, Step M8's phone checks, and `docs/DEMO.md`.
