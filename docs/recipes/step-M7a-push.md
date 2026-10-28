# Step M7a — Push, with the app closed

A reproducible checklist, written from the real diff.

**What you end with:** a parent with a linked child is asked once to allow
notifications. From then on, a tap at the gate buzzes the phone with "Juan
tapped in at 7:56 AM", even with the app swiped away. Signing out stops it,
with or without signal.

```
Gate tap ─► Talaan ─► Expo push service ─► FCM ─► phone, channel "attendance"
                ▲
                │ POST /api/v1/parents/push-tokens { token, platform }
                │
AppShell ── usePushRegistration ──► registerThisPhone()
  signed in, app start,               channel → permission? → Expo address → POST
  every return, address change        (one run at a time)
Home ── useAskForPushPermission ──► askForPushPermissionOnce()
  has a child, in front               channel → "Allow?" once, if canAsk → registerThisPhone()
Sign out ── waitForRegistration() ─► stopPushOnThisPhone()  (channel deleted; Firebase token, 3 s max)
```

## 1. Accounts and the build (owner, `docs/PUSH.md` Parts A to E)

Order matters; each is in `docs/BUILD-LOG.md`, "M7 — Push":

1. `npx eas login`, `npx eas init`. Then by hand in `app.config.ts`:
   `extra.eas.projectId`, then `owner` (`eas init` asks for them one run
   after the other, because it can't edit a `.ts` config).
2. Firebase project, Android app `com.bantayaral.parent`, download
   `google-services.json` into the project root (ignored by git).
3. Firebase service account key. **Check `git status` doesn't list it**
   (P-014), then `eas credentials` → Android → production → Google Service
   Account → FCM V1 → upload. `eas.json` must exist first (P-015).
4. `npx expo install expo-dev-client expo-notifications`, then in
   `app.config.ts`: `"expo-notifications"` in `plugins`, and
   `android.googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"`.
5. `eas env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development --environment preview --environment production`
6. `eas build --profile development --platform android` (emulator: **n**),
   install the APK on the phone.
7. On the server: `PUSH_SENDER=expo`, `EXPO_ACCESS_TOKEN=<token from expo.dev>`.

`eas.json`:

```json
{
  "cli": { "version": ">= 26.0.0", "appVersionSource": "local" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "android": { "buildType": "apk" }
    },
    "production": { "environment": "production" }
  }
}
```

## 2. The one file that talks to expo-notifications (`src/push/notifications.ts`)

- `ensureAttendanceChannel()`: Android only, id `attendance`, name
  `strings.push.channelName`, `AndroidImportance.HIGH`. No `sound` (that's
  what gives the phone's own sound; `sound: "default"` is a dead end, P-017)
  and no `lockscreenVisibility` (owner decision: the phone decides).
- `getPermission()` → `{ granted, canAsk }`, from Expo's `granted` and
  `canAskAgain`, **not** its `status`: on Android 13+ a never-asked permission
  reads `"denied"` (P-018). `askPermission()` → `granted`.
- `getPushToken()`: `null` on an emulator, without a project id, or when Expo
  throws. Project id: `Constants.expoConfig.extra.eas.projectId` checked as a
  string, then `Constants.easConfig.projectId`.
- `onPushTokenChange(onChange)`: calls `onChange()` with **nothing**. The
  listener is handed Firebase's token, not Expo's.
- `stopPushOnThisPhone()`: on Android, `deleteNotificationChannelAsync("attendance")`
  (offline, instant), then `unregisterForNotificationsAsync()` through
  `settleWithin(…, STOP_PUSH_TIMEOUT_MS)` (3 s, `src/lib/settle-within.ts`), errors swallowed (P-016).

`AndroidImportance` is a named import: ESLint's `import/namespace` can't see
it through `* as Notifications`.

## 3. Registration (`src/push/registration.ts`)

```ts
let running: Promise<void> | null = null;
let calledAgain = false;

export function registerThisPhone(): Promise<void> {
  if (running !== null) {
    calledAgain = true;
    return running;
  }
  running = (async () => {
    let registered = false;
    do {
      calledAgain = false;
      registered = await registerOnce();
    } while (calledAgain && !registered);
  })().finally(() => {
    running = null;
  });
  return running;
}
```

Module-level, because the shell and Home both call it, and closing the
permission prompt fires both at once. A second caller re-runs only if the
first run didn't register: permission may have been granted after it checked.

## 4. When it runs

- `src/push/use-push-registration.ts`, in `AppShell` after
  `startFocusTracking`: on `hasToken === true`, run once, then on
  `focusManager.subscribe(focused => …)` and `onPushTokenChange`.
- `src/push/ask-permission.ts`: module flag `askedThisSession`; channel, then
  ask only if `canAsk`, then `registerThisPhone()` if allowed.
- `src/push/use-ask-permission.ts`, on Home:
  `useAskForPushPermission((answer?.children.length ?? 0) > 0)`, waits for
  `useIsFocused()` from `expo-router`.
- `src/auth/session.ts` `useSignOut`, in `finally` before `forgetSession`:
  `await waitForRegistration()` (a running registration finishes, 3 s at
  most, so it can't make the channel again), then `await stopPushOnThisPhone()`.

## 5. Endpoint and string

```ts
export async function registerPushToken(input: {
  token: string;
  platform: "android" | "ios";
}): Promise<void> {
  await requestNoContent({
    method: "POST",
    path: "/api/v1/parents/push-tokens",
    body: input,
  });
}
```

`strings.push.channelName = "Attendance"`.

## 6. Tests

`src/push/__tests__/`: `notifications`, `registration`, `ask-permission`,
`use-push-registration`, `use-ask-permission`; plus the offline sign-out case
in `src/auth/__tests__/session.test.tsx`.

**Dead end:** testing the "once per session" flag by loading the *hook* fresh
with `jest.isolateModules` loads a second React ("Invalid hook call"), and
`jest.isolateModulesAsync` with `import()` needs `--experimental-vm-modules`.
The fix was the design: the flag and logic moved to `ask-permission.ts`, a
plain function tested in isolation, and the hook only decides when to call it.
RNTL 14's `renderHook`, `rerender` and `act` return promises: await them.
