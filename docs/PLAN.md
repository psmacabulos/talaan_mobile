# Build plan

Steps M1 to M8 get to the demo. Work on the first step whose "Owner review" box isn't ticked (`CLAUDE.md`, "One step at a time"). Each step's "Commit:" line is a suggestion; the owner makes the commit.

**The server:** Talaan's live server on Heroku (`https://bantayaral.herokuapp.com`), over HTTPS, deployed through Talaan's Step 54.1. Talaan on the owner's Mac is the fallback (`docs/SERVER.md`).

## Progress

Updated at the end of each step, when its "Owner review" box is ticked.

**To the demo: 40 of 52 tasks, 7 of 10 steps approved.**

`███████████████░░░░░` 77%

| Step | What it gives a parent | Tasks | Status |
|---|---|---|---|
| M1 | The app opens, in the Bantay Aral theme | 9/9 | **Approved** |
| M2 | The app can talk to the server | 5/5 | **Approved** |
| M3 | Sign up, sign in, sign out | 6/6 | **Approved** |
| M4 | Link a child | 4/4 | **Approved** |
| M5 | Today's attendance per child | 4/4 | **Approved** |
| M6 | The notification feed, and a child's day | 4/4 | **Approved** |
| M6.1 | A child who left and came back reads "Back in …" | 4/4 | **Approved** |
| M6.2 | "Another parent linked your child" in the feed | 4/4 | Built, awaiting review |
| M7 | **The phone buzzes when a child taps** | 0/8 | In progress, paused for M6.1 and M6.2 |
| M8 | An installable build, and the demo run | 0/4 | Not started |

M6.1 and M6.2 were added on 2026-10-26, after the plan was written. Each
starts with a "Changed by" line saying why.

M7 is the one that matters: everything before it exists so that a tap at the
gate can reach a parent's phone. M8 only packages it.

## How to run it

Once, on a new machine:

```powershell
nvm use 24.11.0          # Administrator PowerShell
npm install
```

`.env` must exist, with the live server in it:

```
EXPO_PUBLIC_API_URL="https://bantayaral.com"
```

Then, every time:

```powershell
npx expo start --clear
```

Scan the QR code with **Expo Go** on an Android phone on the same Wi-Fi. Use
`--clear` after anything that changed packages, `app.config.ts` or `.env` —
those are read when the bundle is built, not while the app runs.

Expo Go must match the SDK (58). If the phone says the project is
incompatible, install the matching build by hand — `docs/COMMANDS.md`.

**The four checks**, before any step is called done:

```powershell
npm run lint
npm run typecheck
npm run check:colors
npm test
```

CI runs the same four on every push. Green here is not green there, so also
check the Actions tab — `docs/COMMANDS.md`, section 7, reproduces CI exactly.

### The demo accounts

| | |
|---|---|
| Parent | `parent-one@balanga.example` / `Talaan123!` |
| A child to link | Balanga City National Science High School, LRN `100000000002`, last name **Pascual**, born **3 March 2014** |

Signing up as a new parent works too — use a clearly fake email, since this is
the real server.

## The demo (M1 to M8)

Every step carries a **"Check it on the phone"** table: what to tap, and what
should happen. It is written when the step is built, and it is how the owner
decides whether to tick "Owner review". A step is not finished until that
table exists and every row of it passes on a real phone.

### Step M1: Set up the project
- [x] Expo (latest stable SDK) with Expo Router, TypeScript `strict`, npm, Node 24 (`.nvmrc` and `engines`)
- [x] ESLint (Expo's config), Prettier, Jest with `jest-expo` and React Native Testing Library; `npm run lint`, `npm run typecheck`, `npm test`
- [x] GitHub Actions running lint, typecheck and tests on every push, on Node 24
- [x] The app's name **Bantay Aral** and id **`com.bantayaral.parent`**, in `app.config.ts`; `PRODUCT_NAME` in one file
- [x] `src/theme`: the colour tokens (light and dark, following the phone), the type scale, space and corners, from the owner's design in `design/` or `docs/DESIGN.md`'s fallbacks
- [x] Lexend and Atkinson Hyperlegible loaded, the splash screen held until they're ready
- [x] `src/strings.ts` for every string a parent sees
- [x] One styled screen (the sign-in screen's look, no sign-in yet) with the Bantay Aral logo drawn from `reference/mark-shapes.ts`
- [x] `README.md` (what this is, how to start it), `docs/COMMANDS.md`, `.env.example`
Done when: lint, typecheck and tests pass in CI, and the screen looks right on the owner's Android phone, in light and dark.

**Check it on the phone** — `npx expo start --clear`, scan with Expo Go.

| Do this | Expect |
|---|---|
| Open the app | The Bantay Aral logo and the sign-in screen |
| Switch the phone to dark mode | The screen follows, no restart |
| Look at the fonts | Heading is Lexend, body is Atkinson Hyperlegible — not both the same |
| Settings → Display → font size, maximum | Everything still readable, the screen scrolls, nothing clipped |

Commit: `chore: set up the Expo app with the Bantay Aral theme`
- [x] Owner review: I checked it and said "approved"

### Step M2: The API client
- [x] The server's address from `EXPO_PUBLIC_API_URL`, never hard-coded
- [x] Typed requests, every answer checked with Zod, unknown fields ignored
- [x] One error handler for the error shape in `docs/TALAAN-API.md`, plus "no answer at all" (no internet, server down)
- [x] The token in `expo-secure-store`; any `401` clears it and everything cached, and goes to sign-in
- [x] Unit tests with a fake server, covering every error code
Done when: the tests cover every error code, and `GET /schools` works from the phone against the live server.

**Check it on the phone** — nothing new to see. M2 is the plumbing that lets
the app talk to the server; the first screen that uses it is M3's sign-in.
What proves it is `npm test` (every error code the server can answer with)
and the sign-in screen working in M3.

Commit: `feat(api): add the API client with one error handler`
- [x] Owner review: I checked it and said "approved"

### Step M3: Sign up, sign in, sign out
- [x] Sign-up (first and last name, mobile, email, password twice) and sign-in, with the field rules in `docs/PRODUCT-RULES.md`
- [x] A `409` on sign-up offers "Sign in instead"; `wrong_credentials` keeps the email; `too_many_tries` keeps the form usable
- [x] `deviceLabel` from the phone's model
- [x] Sign out calls `POST /logout`, then clears everything locally
- [x] `/me` called on every app start and every return to the foreground
- [x] No "Forgot password?" link yet (Talaan Step 55.5)
Done when: a new parent can sign up, sign out and sign in again, and a sign-in survives closing the app.

**Check it on the phone** — `npx expo start --clear`.

| Do this | Expect |
|---|---|
| Tap **Sign up**, fill it in, submit | Lands on "Your children" |
| Tap **Sign out** | Straight back to sign-in |
| Sign in again | Back to "Your children" |
| **Force-close the app and reopen it** | Straight in, no sign-in — this is the one that matters |
| Sign in with a wrong password | The server's message, and your **email is still filled in** |
| Aeroplane mode, then cold start | "Can't reach Bantay Aral", **still signed in**, with "Try again" |
| Aeroplane mode, then sign out | Signs out cleanly, no error |

Commit: `feat(auth): add sign up, sign in and sign out`
- [x] Owner review: I checked it and said "approved"

### Step M4: Link a child
- [x] The school from `GET /schools`, the LRN (12 digits, number keyboard), last name, and birth date from a date picker
- [x] `404` ("no match") and `409` ("already linked") both shown clearly
- [x] After linking, the new child appears at once (the answer is a `ChildToday`)
- [x] Delete `src/components/dev/server-check.tsx` and its use in `src/app/index.tsx`: the real school picker replaces it (M2)
Done when: linking the demo student works, and a wrong birth date and a second link both say so clearly.

**Check it on the phone** — `npx expo start --clear`, signed in.

| Do this | Expect |
|---|---|
| Tap **Link a child** | The form, with the school list loaded |
| School **Balanga**, LRN **100000000002**, last name **Pascual**, born **3 March 2014** | Back to home, with **Jose Pascual** listed |
| Link the same child again | The server's "already linked" |
| Try again with a wrong birth date | The message **plus** the line naming all four things to check |
| Open the date picker, then press back | Nothing is set, the screen stays |
| Android back inside the school sheet | Closes the sheet only, not the screen |
| Turn Wi-Fi off, open the link screen | The schools error with "Try again" |
| 200% font at 360pt, and dark mode | Everything reachable, nothing clipped |

Commit: `feat(children): link a child with their LRN and birth date`
- [x] Owner review: I checked it and said "approved"

### Step M5: Home
- [x] Each child's card for today: photo (4:5), name, school, "Grade 7 – Rizal", the status pill, the time in plus the latest tap ("Out …" or "Back in …") from the second tap on, and "N taps today" when there are more than 2 (the latest tap replaced "time out" in M6.1)
- [x] The weekend words when `flexible` is true
- [x] Pull to refresh; skeletons while loading; the empty state says how to link a child; the error state offers "Try again"
- [x] The child's school's notification setting shown on the card
Done when: a child who tapped at the gate shows as present, with the time.

**Check it on the phone** — `npx expo start --clear`, signed in, with Jose
Pascual linked.

| Do this | Expect |
|---|---|
| Open the app | A card for Jose: photo, name, "Grade 7 – Rizal", the school, a status pill |
| Before he has tapped | **Not yet tapped** in grey, and a dash for the time in (two dashes before M6.1) |
| Tap his card at the gate, then pull down to refresh | **Present** in green, with the time in |
| Look at the time | The time at the **school** — set your phone to another country and it must not change |
| Read the bottom line of the card | "Your school sends: time in and time out" |
| Turn Wi-Fi off and pull to refresh | "Can't reach Bantay Aral", with "Try again" — still signed in |
| Sign out, sign in as a different parent | No sign of the previous parent's child or photo |
| A parent with no children | "No children linked yet" and how to add one |
| While it first loads | Two grey card outlines, standing still — no shimmer |
| 200% font at 360pt, and dark mode | The card still holds together |

Commit: `feat(home): show each child's day`
- [x] Owner review: I checked it and said "approved"

### Step M6: The feed and a child's day
- [x] Notifications newest first, more as the parent scrolls (`nextBefore`), pull to refresh
- [x] The unread badge on the feed's tab ("9+" from 10)
- [x] Opening one marks it read; "Mark all as read"
- [x] A child's day: every tap, from the taps address
Done when: the feed matches the web parent portal's bell for the same parent.

**Check it on the phone** — `npx expo start --clear`, signed in.

There are now **two tabs** at the bottom: Home and Notifications.

| Do this | Expect |
|---|---|
| Tap a child's card on Home | Their day opens: every tap, not just the first and last |
| Open the Notifications tab | "Katrina tapped in at 2:14 PM", newest first |
| Look at the tab while unread | A badge with the number; **"9+"** once there are ten or more |
| Tap a notification | It stops being bold, the badge drops, and that child's day opens |
| Tap **Mark all as read** | Every row goes un-bold and the badge disappears |
| Scroll to the bottom of a long feed | Older ones load by themselves, with no repeated rows |
| Pull down on the feed | It refreshes, and the spinner does **not** appear while older ones load |
| Background the app and return, three times | One `/me` and one badge call — not one per page you had scrolled |
| Turn Wi-Fi off, open Notifications | The error with "Try again" |
| A child with no taps today | "No taps yet today." |
| 200% font at 360pt, and dark mode | Both tabs still usable |

Commit: `feat(feed): add the notification feed and a child's day`
- [x] Owner review: I checked it and said "approved"

### Step M6.1: The latest tap on the child's card

**Changed by:** the owner, 2026-10-26. Talaan Step 59.3 added `today.latest`,
because a child who tapped in, out, then in again showed "Time out —", the
same as a child who never moved (`docs/PROBLEMS-LOG.md`, P-012). This changes
M5's card.

- [x] `today.latest` read from `/me`; missing (an older server) or unreadable keeps the time in and time out as before
- [x] From the second tap, "Out 4:05 PM" or "Back in 7:05 PM" under the time in, never a plain "In"; nothing more with one tap; no separate "Time out"
- [x] The screen reader hears "Out at 4:05 PM" or "Back in at 7:05 PM", and "N taps today"
- [x] Tests for no tap, one tap, in-out, in-out-in and an older server
Done when: a child who left and came back reads "Back in …" on their card.

**Check it on the phone** — `npx expo start --clear`, signed in, with Jose
Pascual linked. Make the taps with his sticker at `/gate`. Taps on one card
**less than 2 minutes apart count as one**, so wait between them. Pull down on
Home after each.

| Do this | Expect |
|---|---|
| Before he has tapped | "Time in" with a dash, and **no "Time out"** |
| Tap once | His time in, and nothing under it |
| Tap again, 2+ minutes later | The time in, then **Out** and the time of that tap. No "taps today" yet |
| Tap a third time, 2+ minutes later | **Back in** and that time, then **3 taps today**. Never a plain "In" |
| Tap the card | His day opens with all three taps |
| TalkBack on, swipe to the card | It says "… Time in 7:12 AM. Back in at 7:20 AM. 3 taps today" (your times) |
| 200% font at 360pt, and dark mode | The "Back in" line wraps cleanly and is readable |

Commit: `feat(home): show the latest tap on each child's card`
- [x] Owner review: I checked it and said "approved"

### Step M6.2: "Another parent linked your child" in the feed

**Changed by:** the owner, 2026-10-26. Talaan Step 55.2 sends a
`guardian_linked` notice when another parent account links a child. The app
drops it today, while the badge still counts it (`docs/PROBLEMS-LOG.md`,
P-013). It's the one notice meant to catch a stranger linking a child, so it
comes before push.

- [x] The feed reads `guardian_linked` and its `guardian` (or `null`); a kind still unknown is never shown as a tap
- [x] Its own row: "An account named Ana Santos linked to Juan Cruz. If you don't know them, contact the school.", or "A parent account linked to Juan Cruz. …" without a name, looking different from a tap
- [x] Opening it marks it read; the badge and "Mark all as read" count it like any other
- [x] Tests for the new kind, `guardian: null`, and an unknown kind
Done when: a second parent account linking one of parent-one's children shows the notice on parent-one's phone, and the badge clears when it's read.

**Check it on the phone** — `npx expo start --clear`.

A notice goes **only to parents already linked** to the child, never to the
one who links. So the test links a child that `parent-one@balanga.example` is
already linked to, from a throwaway second account:

- **Maria Ramos:** Balanga, LRN `100000000001`, last name **Ramos**, born **2 February 2013**
- or **Carmen Sison:** Balanga, LRN `100000000005`, last name **Sison**, born **6 June 2013**

(Juan Cruz is linked to parent-one too, but has no LRN, so he can't be linked
from the form.) The live server's data can differ from the demo data, so check
first.

**Before you start, know this:** the link is real and stays. A parent can't
unlink themselves (there's no address for it). Only the principal can remove
it, and once they do, that account is **blocked** from linking that child
again. So use a throwaway account, and never reuse it for the same child.
Linking is limited to 10 tries per child in 24 hours (counting tries from
anyone, for that school, LRN and last name; a correct try doesn't count), and
5 wrong tries per parent in 15 minutes.

| Do this | Expect |
|---|---|
| Sign in as parent-one | **Maria Ramos** (or Carmen Sison) is on Home. If not, stop: use a child that is |
| Sign out, sign up a throwaway account (a clearly fake email) | Lands on "Your children", empty |
| Link Maria with her details above | She appears on the throwaway's Home |
| Sign out, sign in as parent-one, open Notifications | The person icon, "**An account named** (the throwaway's name) **linked to Maria Ramos.**", "If you don't know them, contact the school." under it, and the time on the right. Never "tapped" |
| Look at the tab | The badge went up by one |
| Tap the notice | It goes un-bold, the badge drops, and you **stay on the feed** |
| Tap a tap row | It still opens that child's day |
| TalkBack on, swipe to the notice | It reads the whole notice once, then "Marks it as read" while unread |
| With TalkBack, double-tap the unread notice | Focus **stays on that row** (doesn't jump to the top); swipe away and back: no "button" now |
| The next day, look at yesterday's notice at 200% font, 360pt | "Monday, October 26, 6:12 PM" on the right doesn't squeeze the sentence to a word per line |
| 200% font at 360pt, and dark mode | The advice wraps, nothing is cut off, the icon is visible |

Afterwards, ask the principal to remove the throwaway's link from Maria (web
app), so she doesn't keep an extra guardian.

Commit: `feat(feed): show when another parent links a child`
- [ ] Owner review: I checked it and said "approved"

### Step M7: Push
- [ ] The owner's free Expo account and EAS project id, and a free Firebase project with an Android app `com.bantayaral.parent`: give the owner the exact clicks
- [ ] A development build installed on the phone (Expo Go can't receive push on Android)
- [ ] The Android channel `attendance` ("Attendance") created before the token is registered
- [ ] Permission asked right after the first child is linked, never on first launch
- [ ] The Expo push token registered after sign-in, on every app start, and whenever it changes
- [ ] In the foreground: shown in the app, home and feed refreshed. Tapping a push opens the feed at that notification
- [ ] A link notice's push ("A new parent account was linked to Juan", Talaan Step 55.2) opens the feed like any other, and is never treated as a tap (`docs/PROBLEMS-LOG.md`, P-013)
- [ ] The live server switched to send for real: `PUSH_SENDER=expo` and `EXPO_ACCESS_TOKEN`, set by the owner on Heroku (`docs/SERVER.md`, "Testing a real push")
Done when: a tap at `/gate` for a linked child buzzes the phone, with the app closed.
Commit: `feat(push): get a push when a child taps in or out`
- [ ] Owner review: I checked it and said "approved"

### Step M8: The demo build
- [ ] Check with the owner that Heroku runs Talaan's latest approved step, with `PUSH_SENDER=expo`
- [ ] The app icon and splash screen from the logo, on white, with the name Bantay Aral
- [ ] An installable Android build pointing at the live server over HTTPS
- [ ] The demo script below in `docs/DEMO.md`, run from start to finish
Done when: the owner runs the demo script on a real phone without help.
Commit: `chore(release): add the demo build`
- [ ] Owner review: I checked it and said "approved"

## The demo script

**Before:** Talaan is live on Heroku, sending pushes (`PUSH_SENDER=expo`), with the gate tablet connected. One of the owner's NFC stickers is linked to the demo student Jose Pascual (web app: Students → Jose Pascual → Card serial). Balanga's notification setting (Settings) isn't "Off".

1. Install the demo build on an Android phone.
2. Sign up as a new parent. Or sign in as the demo parent `parent-one@balanga.example`, password `Talaan123!` (the demo password keeps the code name).
3. Link a child: school **Balanga City National Science High School**, LRN **100000000002**, last name **Pascual**, birth date **2014-03-03** (Talaan's demo data, checked 2026-10-19; if it has changed, ask the owner).
4. Allow notifications.
5. Tap Jose's sticker at the gate. The phone shows "Jose tapped in at …". A push may take a few minutes when the server is busy: the time it shows is always the real tap time.
6. Open the app. Home shows Jose present, with his time in. The feed shows the notification. Open it, and it's read.
7. Tap again after 2 minutes: "Jose tapped out at …".

## After the demo

Each becomes its own step when it's due:
- **Forgot password, from the app,** once Talaan's Step 55.5 adds it. Parents recover their own password, never by asking the school.
- **Deleting your own account,** with Talaan's Step 60. Both app stores require it before publishing an app that makes accounts.
- **iOS,** once the owner decides on the Apple Developer account.
- **Publishing to Google Play:** a privacy policy page (for example on `bantayaral.com`) and the store listing.
- Per-school colours, the last data shown while offline, and a Filipino translation.
