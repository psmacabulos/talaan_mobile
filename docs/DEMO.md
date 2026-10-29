# The demo

A checklist for showing Bantay Aral working from start to finish, on the demo
APK (M8). Run it the same way every time, so a step that broke shows up.

Two parts, in this order: **a brand-new parent** first (the first-time steps
every real parent goes through: sign up, link a child, allow notifications),
then **your own account** (is everything still working?). About 10 minutes in
all.

The order matters. "Allow notifications?" is asked once per phone, not per
account, the first time Home has a child. Run on a fresh install, Part 1 is
where it appears; after that, the phone has its answer and never asks again.

```
Phone (demo APK) ── HTTPS ──► Talaan, https://bantayaral.com
                                  ▲            │
        gate tablet: NFC tap ─────┘            └──► Expo push ─► Firebase ─► Phone buzzes
        (or web app: Record time in)
```

## Before you start

- [ ] **The demo APK is on the phone, freshly installed, and nothing else
  called Bantay Aral.** Uninstall the development build first (long-press its
  icon → Uninstall), then open the `eas build --profile preview` link on the
  phone (`docs/COMMANDS.md`, "Make the demo APK"). Android shows two screens
  on the way, both expected for an app from outside the Play Store: allow
  your browser to **install unknown apps**, then Play Protect's "unrecognised
  app" warning → **Install anyway**.
- [ ] **The phone is online** (mobile data or any Wi-Fi). The Mac doesn't need
  to be running anything.
- [ ] **A test student** to link in Part 1, from the web app: their school,
  LRN, last name and birth date. Use a test student, not a real child:
  linking sends that child's other parents "A new parent account was linked".
- [ ] **A way to make a tap** for each child: their NFC sticker at the gate
  tablet (`/gate`), or in the web app, signed in as the principal:
  **Attendance** → the child's class → **Record time in** (once per child per
  day, before any tap).
- [ ] **The school's notifications aren't "Off"** (web app → Settings).
- [ ] **An email address not used before** for Part 1's new account. The
  sign-up limits allow 100 sign-ups an hour from one network, so testing is
  fine.

## Part 1 — a brand-new parent

| Do | You should see |
|---|---|
| Open Bantay Aral | The Bantay Aral logo on the splash, whole, then sign-in. No developer menu, no Expo launcher |
| **Sign up** with the new email | Each field is checked as you type; then Home, with no children yet |
| **Link a child:** the test student's school, LRN, last name and birth date | The child appears on Home |
| **Allow notifications** when asked | Android's own "Allow Bantay Aral to send you notifications?", once. On Android 12 and older there's no prompt: notifications are on from the start |
| Keep the app open on Home. Make a tap for the child | A banner drops down with sound; Home's time updates; the bell's badge goes up |
| Tap the banner | Notifications, at that row, read; the badge drops |
| Wait 2 minutes, make another tap (or a time out) | "Tapped out at …" |
| Sign out | Sign-in. A tap for this child now sends this phone nothing |

## Part 2 — your own account

| Do | You should see |
|---|---|
| Sign in with your parent account | Home, with your children and today's status for each. No "Allow notifications?": the phone already answered in Part 1 |
| Swipe the app away. Make a tap for one of your children | Within seconds: a push, **Bantay Aral** at the top, the child's first name over "Tapped in at …" with the real time, and a sound |
| Tap the push | The app opens on **Notifications**, at that row, already read (no dot) |
| Go to Home | That child's time in is there |
| Sign out | Back to sign-in |

## If something goes wrong

| What you see | Look at |
|---|---|
| No push at all | The school's setting isn't "Off"; notifications allowed in Settings → Apps → Bantay Aral; `docs/PUSH.md`, "When it does not work" |
| "Can't reach Bantay Aral right now." on every screen | The phone's internet; `https://bantayaral.com/api/v1/health` in the phone's browser |
| Android says "App not installed" | The development build is still on the phone: uninstall it first |
| The push arrives minutes late | Normal on some cheap phones' battery savers (`docs/LEARNING-LOG.md`, "Why a push can arrive late"). The time in the push is always the real tap time |

## Afterwards: back to developing

The demo APK doesn't load code from the Mac. To develop again, uninstall it
and reinstall the development build from expo.dev → the project → Builds →
the latest `development` build → Install, then
`npx expo start --dev-client --clear`.
