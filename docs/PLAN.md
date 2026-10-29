# Build plan

Steps M1 to M8 get to the demo. Work on the first step whose "Owner review" box isn't ticked, skipping any the owner set aside or parked (`CLAUDE.md`, "One step at a time"). Each step's "Commit:" line is a suggestion; the owner makes the commit.

**The server:** Talaan's live server, `https://bantayaral.com`, over HTTPS, sending real pushes. Talaan on the owner's Mac is the fallback (`docs/SERVER.md`).

## Progress

Updated at the end of each step, when its "Owner review" box is ticked.

**To the demo: 50 of 60 tasks, 11 of 12 steps approved** (M6.3b and M6.4b, set aside, not counted).

`█████████████████░░░` 83%

| Step | What it gives a parent | Tasks | Status |
|---|---|---|---|
| M1 | The app opens, in the Bantay Aral theme | 9/9 | **Approved** |
| M2 | The app can talk to the server | 5/5 | **Approved** |
| M3 | Sign up, sign in, sign out | 6/6 | **Approved** |
| M4 | Link a child | 4/4 | **Approved** |
| M5 | Today's attendance per child | 4/4 | **Approved** |
| M6 | The notification feed, and a child's day | 4/4 | **Approved** |
| M6.1 | A child who left and came back reads "Back in …" | 4/4 | **Approved** |
| M6.2 | "Another parent linked your child" in the feed | 4/4 | **Approved** |
| M6.3a | Notifications grouped: Today, Yesterday, this week, this month, by month | 4/4 | **Approved** |
| M6.3b | Notification rows with icon tiles, like the mockup | 0/4 | Set aside: comes back with Notifications as an inbox (`docs/NAVIGATION.md`) |
| M6.4a | Home's child card as designed: status icons, the times panel | 4/4 | **Approved** |
| M6.4b | Home's header, tab icons, and a card with only what matters | 4/4 | Parked: built and committed, its phone check and polish come later |
| M7a | **The phone buzzes when a child taps**, with the app closed | 7/7 | **Approved** |
| M7c | The Bantay Aral logo on every push | 3/3 | **Approved** |
| M7b | A push with the app open, and a tap on one opens the feed | 2/2 | **Approved** |
| M8 | An installable build, and the demo run | 2/4 | Built; waiting for the owner's build and demo run |

Work that waits on Talaan is planned under "Waiting on the server", below
the demo script, and is not counted here.

M6.1 to M6.4b were added on 2026-10-26 and 27, after the plan was written. Each
starts with a "Changed by" line saying why. On 2026-10-27 the owner chose to
redo the app one tab at a time, following the new design, starting with Home
(`docs/NAVIGATION.md`).

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
| Tap **Sign up**, fill it in, submit | Lands on "My children" |
| Tap **Sign out** | Straight back to sign-in |
| Sign in again | Back to "My children" |
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
| Sign out, sign up a throwaway account (a clearly fake email) | Lands on "My children", empty |
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
- [x] Owner review: I checked it and said "approved"

### Step M6.3a: The notifications, grouped

**Changed by:** the owner, 2026-10-27: "all notifications are just mixed up…
find a way so it won't end up just a long list". The owner chose the grouping
and the time on the right (settling `docs/DESIGN-QUESTIONS.md` #16), and
asked for filter chips to wait for the server (`docs/API-REQUESTS.md` #4).
Split in two at the review, so each half fits one sitting.

- [x] Sections on the school's calendar: Today, Yesterday, Earlier this week (from Monday), Earlier this month, then one per month; headers stick while their section scrolls and are headings to TalkBack
- [x] Each row's time on the right, written for its section ("7:12 AM", "Mon 7:30 AM", "Oct 14, 4:10 PM"); a screen reader always hears the time and the day
- [x] One "today" for the whole screen, read again on return to the app and on pull to refresh
- [x] The bottom of the list: "That's all your notifications.", or "Couldn't load older notifications." with Try again, keeping the rows above
Done when: a long feed reads as days and months, not one list, and its end and its failures both say so.

**Check it on the phone** — `npx expo start --clear`, signed in as
parent-one (who has taps on more than one day).

| Do this | Expect |
|---|---|
| Open Notifications | Headers: **Today**, **Yesterday**, **Earlier this week**, **Earlier this month**, then months, only those with rows |
| Look at a row | "Maria Ramos tapped in" with the time on the right; older sections add the day ("Mon 7:30 AM", "Oct 14, 4:10 PM") |
| Scroll down slowly | The current section's header stays pinned at the top, solid, rows don't show through it |
| Scroll to the very bottom | Older ones load by themselves, then "That's all your notifications." |
| Scroll down, turn on aeroplane mode before the next page loads, keep scrolling | "Couldn't load older notifications." and Try again under the rows. Rows above stay, and the Metro log shows **one** failed request, not a stream of them. Aeroplane mode off, Try again: they load |
| Pull down to refresh | Refreshes, no duplicated headers |
| TalkBack, then the reading controls set to Headings, swipe down | Jumps from section header to section header |
| TalkBack on a row | "Maria Ramos tapped in at 7:12 AM, today" (or the day) |
| On a Monday | Last Friday is under "Earlier this month", not "Earlier this week" (weeks start Monday) |
| 200% font at 360pt, and dark mode | The time never squeezes; the sentence wraps instead. Headers readable |

Commit: `feat(feed): group notifications by day, week and month`
- [x] Owner review: I checked it and said "approved"

### Step M6.3b: Notification rows with icon tiles

**Changed by:** the owner, 2026-10-27, as the second half of M6.3.

**Set aside** the same day: the owner chose to redo the app one tab at a time
from the new design, Home first. These tiles come back when Notifications
becomes an inbox (`docs/NAVIGATION.md`), using the same `IconTile` as Home.

- [ ] An icon tile on each row: an arrow in on the "present" colours for a time in, an arrow out on the "time out" colours for a time out, the person-plus for a link notice
- [ ] Each section's rows in one card, with hairline dividers; the unread dot beside the time
- [ ] Contrast tests for every new pair (icon on tile 3:1, dot on tint 3:1, time text 4.5:1), light and dark
- [ ] A pull to refresh that fails while rows are showing says so (the server's message, Try again). It says nothing today, from before M6.3a
Done when: the feed looks like the mockup's screen 8, minus the filter chips.
Commit: `feat(feed): add icon tiles to notification rows`
- [ ] Owner review: I checked it and said "approved"

### Step M6.4a: Home's child card, as designed

**Changed by:** the owner, 2026-10-27, from
`design/BantayAral Children Dashboard Comparison.png`. The owner decided: icons
drawn as code, art as exported files; the Out tile **blue**, not the design's
red (red means Absent); no settings gear until there's a settings screen.
Split from M6.4b at the review.

- [x] A status pill with an icon: a tick for Present, a clock for Late, "!" for Absent; "Not yet tapped" stays word-only
- [x] The times panel: a tile and "Time in" over the time; from the second tap, "Out" (blue tile) or "Back in" (green tile) beside it; a grey tile until there's a time in; stacked at large text sizes
- [x] A chevron showing the card opens the child's day; the loading skeleton in the new shape
- [x] Contrast tests for every tile, and tests for the panel, the pill and the stacking
Done when: the card looks like the design in light and dark, and still reads in one swipe.

**Check it on the phone** — `npx expo start --clear`, signed in as
parent-one. Make taps with a sticker at `/gate`, 2+ minutes apart, and pull
down after each.

| Do this | Expect |
|---|---|
| A child with no tap yet | "Not yet tapped" pill (no icon), a **grey** tile and "Time in —", nothing on the right |
| After one tap | Pill **Present** with a tick (or **Late** with a clock), a **green** tile and the time in, nothing on the right |
| After a second tap | Beside it, a divider, then a **blue** tile and "Out" over that time |
| After a third tap | The right half says "Back in" with a **green** tile, and "3 taps today" under the panel |
| A child with no tap after the school marks absences (the server decides when) | **Absent** in red with "!", grey tile, "Time in —" |
| A chevron on the right of each card | Tapping anywhere on the card opens the child's day |
| TalkBack on a card | One swipe reads it all: "… Present. Time in 7:12 AM. Out at 4:05 PM" |
| Settings → font size at maximum, at 360pt | The two halves **stack** with a line between them; no time cut off |
| Dark mode | Light tiles with dark arrows, readable |
| While Home first loads | Skeleton cards with a panel bar, standing still |

Commit: `feat(home): restyle the child card to match the design`
- [x] Owner review: I checked it and said "approved"

### Step M6.4b: Home's header and tab icons, as designed

**Changed by:** the owner, 2026-10-27, the second half of M6.4. No gear
(`docs/DESIGN-QUESTIONS.md`, "The Home design"). The owner made it a rule that
pictures are shrunk to their shown size (`CLAUDE.md`). After the first review
the owner asked for more: "The important thing for the parent is the time in
and out, and whether the child is late." The school's name and what it sends
come off the card, the logo is bigger, the picture becomes a background, and
two children fit without scrolling.

- [x] The header: the logo, bigger (mark 52, wordmark 28), "My children" large, "Check who's in school, the moment they tap in." on one line
- [x] Tab icons filled when active, outline when not
- [x] The school illustration as a background behind the right of the logo and heading, from the owner's file in `assets/images/`, shrunk from 1536 × 1024 (1.5 MB) to 360 × 240 (105 KB); left out at large text sizes
- [x] The card: no school name and no "Your school sends" line; the status pill straight under the grade and section; a smaller photo (64 × 80)
Done when: Home's top and the tab bar look like the design in light and dark, and a parent with two children sees both, times included, without scrolling.

**Check it on the phone** — `npx expo start --clear`, signed in as
parent-one.

| Do this | Expect |
|---|---|
| Open Home | The logo bigger, top left; "My children" large; the school in the top right **behind** the logo's row and beside the heading, like a background; "Check who's in school, the moment they tap in." on **one line** under them |
| Look at the school picture closely | Sharp, not blurry. If it looks soft, say so: it goes up a size |
| Where the school sits | Its base level with the bottom of "My children". If it should sit lower or bigger, say so |
| Dark mode | The words readable; the school has no pale box or halo around it |
| A card | Photo, name, "Grade 7 – Rizal", then the status pill straight under it. **No school name**, and **no "Your school sends"** line |
| parent-one with two children (Maria and Carmen) | Both cards, times included, on screen without scrolling. "Link a child" and "Sign out" may be below |
| The tab bar | Home's house **filled**, the bell an outline; open Notifications and they swap. The badge still sits on the bell's corner |
| A small phone, or Display size at its largest (360pt) | "My children" on one line at the normal font size |
| Font size one step up ("Large") | The heading may wrap to two lines; nothing cut off; no letter sitting on the trees or the clouds |
| Font size at maximum | No school picture; the heading has the full width; the logo's words a size smaller and **never cut off** at the right |
| Font size between Large and the step before maximum | Look behind "Aral" in the logo: no bit of cloud showing through. If there is, say so |
| TalkBack, swipe from the top | "Bantay Aral, image", then "My children, heading", then the line. It never stops on the school |
| Pull down from the top | Still refreshes |

Commit: `feat(home): trim the card and add the designed header and tab icons`

**Parked** by the owner, 2026-10-27: "We can stop on the header or tab for
now … the important thing to finish now is the push notifications." The code
is committed (`be8aa0c`) and its tests pass; the phone check above hasn't been
done. It comes back in the polish phase ("After the demo").

- [ ] Owner review: I checked it and said "approved"

### Step M7a: Push, with the app closed

Split from M7 on 2026-10-28 to keep each step reviewable in one sitting: M7a
makes the phone buzz with the app closed, M7b handles a push while the app is
open and what a tap on one opens.

- [x] The owner's free Expo account and EAS project id, and a free Firebase project with an Android app `com.bantayaral.parent`: give the owner the exact clicks (`docs/PUSH.md`, Parts A to C)
- [x] A development build installed on the phone (Expo Go can't receive push on Android)
- [x] The Android channel `attendance` ("Attendance") created before the token is registered
- [x] Permission asked once a child is linked, never on first launch. Asked on Home, so parents who linked before M7 are asked too
- [x] The Expo push token registered after sign-in, on every app start, every return to the foreground, and whenever it changes
- [x] Signing out stops pushes on this phone, even with no signal (found in the plan review)
- [x] The live server switched to send for real: `PUSH_SENDER=expo` and `EXPO_ACCESS_TOKEN`, set by the owner (2026-10-28)
Done when: a tap at `/gate` for a linked child buzzes the phone, with the app closed.
Commit: `feat(push): get a push when a child taps in or out`

**Check it on the phone.** No new build: the code reaches the phone over
Wi-Fi. `npx expo start --dev-client --clear`, then open **Bantay Aral** (not
Expo Go).

| Do this | Expect |
|---|---|
| Sign in as a parent with a linked child | Home asks "Allow Bantay Aral to send you notifications?" once |
| Tap **Allow** | Nothing else visible. The server's log shows one `POST /api/v1/parents/push-tokens` answering `204` |
| Settings → Apps → Bantay Aral → Notifications | An "Attendance" category |
| Swipe the app away, then tap the child's card at the gate | Within seconds: "Bantay Aral · Juan tapped in at 7:56 AM", with a sound |
| Lock the phone and tap again | The push shows on the lock screen (or "contents hidden", if the phone is set to hide them) |
| Leave Home and come back, pull to refresh | No second "Allow" prompt |
| Sign out, then tap the card at the gate | No push |

- [x] Owner review: I checked it and said "approved" (2026-10-28)

### Step M7c: The Bantay Aral logo on every push

**Changed by:** the owner, 2026-10-28, after the first real pushes: "The logo
is not showing … There is no need to repeat the words Bantay Aral on every
children tap." Pushes showed Expo's placeholder "^". Android draws a push's
small icon in one colour from its shape alone, so the mark goes in as a white
outline in a circle of the mark's blue. The owner chose that alone ("A"), with
no full-colour large icon, and kept the app icon and splash for M8.

- [x] `assets/images/notification-icon.png`, from `design/logo/` (96 × 96, the mark as a white outline)
- [x] `expo-notifications` given that icon and the mark's blue `#1149A6`, checked against `src/theme` by `app.config.test.ts`
- [x] The second "Bantay Aral" (the push's title) asked of Talaan: `docs/API-REQUESTS.md`, item 5. The child's photo isn't asked for (it needs a photo link that works without signing in)
Done when: a push shows the Bantay Aral mark, not Expo's "^".
Commit: `feat(push): show the Bantay Aral logo on every push`

**Check it on the phone.** This one needs a **new development build**: the
icon is built into the app.

```bash
eas build --profile development --platform android
```

Answer **n** to "Install and run the Android build on an emulator?", open the
link on the phone, install the APK over the old one. Then
`npx expo start --dev-client --clear` and open **Bantay Aral**.

| Do this | Expect |
|---|---|
| Swipe the app away, then tap the child's card at the gate | The push has the Bantay Aral mark, white in a blue circle, not the "^". The sun's three rays are whole, not cut off |
| Pull the shade down further to expand it | The same mark, sharp |
| Look at the status bar before opening it | A small white Bantay Aral outline |
| Phone in dark mode, tap again | The same mark, still clearly visible |
| Read the words | Still "Bantay Aral" twice until Talaan drops the title (`docs/API-REQUESTS.md`, item 5). Not this step's to fix |

- [x] Owner review: I checked it and said "approved" (2026-10-28)

### Step M7b: Push, with the app open
- [x] In the foreground: shown in the app, home and feed refreshed. Tapping a push opens the feed at that notification
- [x] A link notice's push ("A new parent account was linked", Talaan Step 55.2) opens the feed like any other, and is never treated as a tap (`docs/PROBLEMS-LOG.md`, P-013)
Done when: a push arriving with the app open shows and refreshes Home, and tapping any push opens the feed at it.
Commit: `feat(push): show pushes in the app and open the feed from one`

Owner decisions (2026-10-29): with the app open, Android's own banner, not an
in-app one; tapping a push marks it read. How it works: `docs/PUSH.md`, "A
push with the app open, and a tap (M7b)".

No new build: `npx expo start --dev-client --clear`, then open Bantay Aral on
the phone.

| Do this on the phone | You should see |
|---|---|
| App open on Home, tap a child in at the gate (or **Record time in**) | A banner drops down with sound, **Katrina** over "Tapped in at …". Home's times update within seconds, and the bell's badge goes up |
| Tap that banner | The Notifications tab opens with that row in view, and it turns read (no dot). The badge drops |
| Swipe the app away, make a tap, tap the push | The app opens on Notifications, at that row, read |
| Press Home (app in the background), make a tap, tap the push | The same |
| Open a child's day, make a tap, tap the push, then press Back once | Notifications, then Back lands on **Home**, not on another list |
| Sign out, sign back in | Home, as usual. The list does **not** open by itself |
| A link notice's push (link a child from a second account) | Opens Notifications, never a child's day |
| Font size at maximum, small phone | The tapped row sits fully in view, not under the "Today" header |
| TalkBack on, app open, make a tap | The banner is read out |

- [x] Owner review: I checked it and said "approved" (2026-10-29)

### Step M8: The demo build
- [x] The live server runs Talaan's latest step and sends pushes: real pushes from `https://bantayaral.com` reached the owner's phone on 2026-10-28 and 29 (Heroku is gone, P-007)
- [x] The app icon and splash screen from the logo, on white. The name Bantay Aral was already the app's name (M1); the splash shows the mark only, since Android 12+ shows a round icon there
- [ ] An installable Android build pointing at the live server over HTTPS: the `preview` profile is ready in `eas.json`; the owner runs `eas build --profile preview --platform android`
- [ ] `docs/DEMO.md` run from start to finish, both parts, on the APK
Done when: the owner runs the demo script on a real phone without help.
Commit: `chore(release): add the demo build`

Owner decisions (2026-10-29): the demo runs on the owner's phone, with the
development build uninstalled first; `docs/DEMO.md` has two parts (a new
parent first, then their own account) and uses any test student.

| On the phone, with the APK installed | You should see |
|---|---|
| The home screen and app drawer | The Bantay Aral mark on white, named "Bantay Aral", not Expo's logo |
| Android 13+: Settings → Wallpaper → Themed icons on | A one-colour outline of the mark |
| Phone in dark mode | The same icon, still white behind the mark |
| Force-stop, then open it | The splash: the mark on white, whole, not cut off at a circle's edge |
| Turn on airplane mode, pull to refresh on Home | "Can't reach Bantay Aral right now." with Try again |
| `docs/DEMO.md`, parts 1 and 2 | Every row as written |

- [ ] Owner review: I checked it and said "approved"

## The demo script

In `docs/DEMO.md` since M8: two parts, the owner's own account and a
brand-new parent, with any test student (owner decision, 2026-10-29).

## Waiting on the server

Planned 2026-10-28, from the owner's decisions on `docs/API-REQUESTS.md` (the
reasons are in Talaan's `docs/PARENT-APP-REQUESTS.md`). **Nothing here is
built yet.** Each starts only when the owner says that Talaan step is
deployed. First, the owner gives a fresh copy of Talaan's
`docs/PARENT-API.md` as `docs/TALAAN-API.md`; the exact fields come from
there, not from this plan. Then each goes through the usual plan, review and
approval, one at a time.

**Order matters for one of them.** Once 59.7 makes the list today only, a
parent can no longer see yesterday's taps in Notifications. The Attendance day
view (below) needs no server change, so it should be in parents' hands
**before** 59.7 goes live, or the history has no home for a while.

### After Talaan 59.6: one "Bantay Aral", and statuses that never change

The push's title becomes the child's first name (first dropped, then put back
as the name: `docs/API-REQUESTS.md`, 5 and 8), and the status values become a
promise. Both need almost nothing from the app.
- [x] `docs/TALAAN-API.md` refreshed (2026-10-29)
- [ ] The comment in `src/api/schemas.ts` on dropping an unreadable child says the values are now fixed in `/api/v1`, and why the drop stays (a malformed answer)
- [x] On the phone: a gate tap shows "Bantay Aral" once at the top, then **Juan** over "Tapped in at 7:56 AM". Two taps close together fold into "**Katrina** Tapped in at 8:55 AM" lines, with no "null" (checked by the owner, 2026-10-29)
Done when: a push shows "Bantay Aral" once and never "null".

### After Talaan 59.7: a badge that clears, and today's list

- [ ] Opening Notifications calls `POST /notifications/seen` once each time the tab comes into view, then refetches the badge. The badge keeps showing `unreadCount`, which the server now counts as "newer than seen and still unread"
- [ ] The list shows what the server sends: today's notices, plus any unread link notice from an earlier day, which shows its date so it doesn't read as today's
- [ ] The week and month sections (M6.3a) and the paging (`nextBefore`) go, if the new contract drops them. A new empty state for a day with no taps yet
- [ ] "Mark all as read" decided with the owner first: with a seen time, the badge no longer needs it, and it still clears the other parent's marks (`read` is shared)
Done when: opening the bell clears the badge on this phone only, and the other parent still sees their badge.

### After Talaan 59.8: the Report button

- [ ] A link notice (`guardian_linked`) with `reportedAt: null` has a **Report** button: at least 48 points high, labelled for the screen reader, disabled while sending. It calls `POST /notifications/:id/report`
- [ ] The advice changes in `src/strings.ts` from "If you don't know them, contact the school." to "If you don't know them, tap Report and we'll look into it." Once reported (`reportedAt` set): "Reported. We'll check this link.", and no button. `docs/PRODUCT-RULES.md` changes with it
- [ ] An error shows the server's message with Try again. A second report changes nothing on the server, so a retry is safe
- [ ] Whether Report asks "Are you sure?" first, decided with the owner
- [ ] `403 link_blocked` needs nothing: the app already shows the server's message as it is
Done when: a parent reports a link notice, the wording changes, and the super admin gets the email.

### Attendance: a day view now, a month after Talaan 63.1

From `docs/NAVIGATION.md`, section 3.
- [ ] **A day view (no server change):** an Attendance tab with the child, "‹ Monday, October 26 ›", that day's status and its taps, from `GET /children/:id/taps?date=`, which already answers any past day. Ship it before 59.7 goes live (above)
- [ ] **The month list, after Talaan 63.1:** one row per school day from `GET /children/:id/attendance?from=&to=`. Not before: 63.1 waits for the school calendar, so a holiday never shows as Absent. How a day before the child was added shows is Talaan's open question for 63.1
Done when: a parent can find any past day's taps after the list became today only.

## After the demo

Each becomes its own step when it's due:
- **Forgot password, from the app,** once Talaan's Step 55.5 adds it. Parents recover their own password, never by asking the school.
- **Deleting your own account,** with Talaan's Step 60. Both app stores require it before publishing an app that makes accounts.
- **Polish Home (M6.4b, parked):** run its phone check, then fix what it finds: the picture's place and size, the logo at large text, two children without scrolling on a small phone. Then the other tabs, one at a time (`docs/NAVIGATION.md`).
- **What each school sends, on the Profile tab.** Since M6.4b it's on no screen, so a parent at a school with notifications off can wait for a push that never comes. The wording is in `docs/PRODUCT-RULES.md`, "Who gets notified".
- **iOS,** once the owner decides on the Apple Developer account.
- **Publishing to Google Play:** a privacy policy page (for example on `bantayaral.com`) and the store listing.
- Per-school colours, the last data shown while offline, and a Filipino translation.
