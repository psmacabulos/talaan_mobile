# Navigation: an inbox and an attendance record

The owner, 2026-10-27: "Notifications when marked read should all disappear,
because they are notifications. There should be another tab at the bottom,
just like the design says, which is Attendance. That is where the previous
time ins go."

This is the options and the recommendation. Nothing here is built until the
owner decides (the table at the end).

**2026-10-27, the owner:** "let's do it one tab at a time", Home first,
from the new design (Steps M6.4a and M6.4b in `docs/PLAN.md`). The decisions
below are still open for the other tabs.

## The idea, in one line

**Notifications is an inbox: what still needs you. Attendance is the record:
what happened.** That's the mockup's shape, and it's how Android's own apps
work: Gmail's inbox empties as you deal with it, and the mail is still there
in its folders.

```
Home              Attendance              Notifications          Profile
today, per child  every day, per child    only what's unread     account, sign out
(as now)          (new)                   (empties when read)    (new)
```

## 1. Four tabs, not five

The mockup has five: Home, Attendance, Children, Notifications, Profile.

**Recommended: Home · Attendance · Notifications · Profile.**

- "Children" repeats Home: Home already lists each child and has "Link a
  child". Two tabs showing the same children make a parent wonder which is
  the real one.
- Material's guidance is three to five bottom tabs. Fewer is easier with one
  hand, and leaves each label room at 200% font on a 360pt screen.
- **Profile** gets sign out (it's on Home today), the parent's name and email,
  each school's notification setting (read-only; since M6.4b it's on no other
  screen, so a parent whose school sends nothing can only learn it here), and later "Delete my
  account" (Talaan Step 60, which both stores require).

## 2. Notifications as an inbox

Unread only. Opening one marks it read and it leaves the list. A tap's
notification opens that child's day in Attendance. When the list is empty:
"You're all caught up", with a link to Attendance. Marking all as read gets a
short message with **Undo** (Material's snackbar), so a slip isn't final.

**Two server problems stand in the way. Both are in `docs/API-REQUESTS.md`
already:**

1. **Read marks are shared between a child's parents** (docs/TALAAN-API.md,
   the feed). If read means gone, then when one parent opens "Maria tapped
   in", it **vanishes from the other parent's phone before they've seen it**.
   Today that only clears a bold row; in an inbox it hides the notification
   completely. Read must become per parent (`docs/API-REQUESTS.md` #2).
2. **The feed can't ask for unread only** (`docs/API-REQUESTS.md` #4,
   `unread=true`). Filtering in the app would page through read notices to
   find unread ones.

The "another parent linked your child" notice is already per parent, so it's
safe to clear on read.

**Without the server change**, the app could hide read rows from the pages it
has loaded. That mostly works, since unread ones are the newest. But problem
1 stays: one parent would silently empty the other's inbox. **Not
recommended.**

## 3. Attendance

The mockup's screen 6: pick a child (no picker with only one), a month with
‹ ›, one row per school day: the date, the status in words and colour (Present,
Late, Absent), the time in, and the latest tap. Tapping a day opens the
child's day screen that already exists, with every tap.

**What the server gives today:** `GET /children/:id/taps?date=…` answers
**one day**, with its status. A month list would be about 22 requests, on a
parent's mobile data, every time the month is opened. Too many.

- **The month list needs one new endpoint** (`docs/API-REQUESTS.md` #5, to
  write): a range per child, one row per day: `{ date, status, flexible,
  timeIn, latest, tapCount }`.
- **What works today, with no server change:** a **day view**: the child,
  "‹ Monday, October 26 ›", that day's status and its taps, one request per
  day viewed. It ships the tab now, and becomes the "tap a day" screen once
  the month list exists.

## 4. Home stays "today"

As now: one card per child for today. The mockup's "Recent activity" is left
out, since Notifications and Attendance cover it. The mockup's "Today's
summary" (2 present, 0 late) is still an open question
(`docs/DESIGN-QUESTIONS.md`).

## Is the mockup enough?

For the structure, yes: it has Attendance (screen 6), Notifications (8) and
Profile (10). What it lacks (empty, loading, offline, errors, dark mode, a
parent with one child, 200% font) comes from `docs/DESIGN.md` and the theme,
as every screen so far has.

A designer would help with one thing: what an empty inbox and an empty month
look like. ChatGPT pictures aren't a good source. They look finished but
invent things the server doesn't have, as the mockup did ("In class",
"Homeroom teacher", the card serial; `docs/DESIGN-QUESTIONS.md`). A Figma file
would be the best input if the owner ever wants one. No new skills are
needed for this.

## The order, recommended

The demo's point is still the phone buzzing (M7). None of this blocks it, and
it doesn't block this.

| # | Step | Needs the server? |
|---|---|---|
| 1 | Four tabs, a Profile tab (sign out moves there), Attendance as a day view | No |
| 2 | M7, push | No (Firebase and Expo setup) |
| 3 | Notifications as an inbox | Yes: #2 per-parent read, #4 unread filter |
| 4 | Attendance as a month list | Yes: #5 attendance range |

Meanwhile the owner takes #2, #4 and #5 to Talaan. Steps 3 and 4 start as
soon as they're live.

**M6.3b (icon tiles) is dropped as planned.** Its icon tiles move into step 3,
and the failed-refresh message into step 1.

## Decisions

| # | Question | Recommended | Decision |
|---|---|---|---|
| 1 | Notifications: unread only, read ones leave | Yes, once read is per parent (#2) and the unread filter exists (#4) | |
| 2 | Tabs | Home, Attendance, Notifications, Profile (no Children tab) | |
| 3 | Attendance before the range endpoint | A day view now, the month list later | |
| 4 | Order | Tabs + Attendance day view, then M7 push, then the inbox, then the month list | |
| 5 | M6.3b as planned | Dropped, folded into steps 1 and 3 | |

## Open questions

- In the Attendance month list, are weekends shown? (Recommended: only days
  with a tap, so a weekend tap is still shown, and empty weekends aren't.)
- Holidays and class suspensions: past days could read "Absent" until Talaan
  Step 63 handles them. That's the server's call, but it shows on this screen.
