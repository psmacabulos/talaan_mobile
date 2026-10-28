# What the app needs from the API

Things this app wants that `docs/TALAAN-API.md` doesn't offer yet. The owner
takes these to the Talaan repository, where each becomes a step there
(`CLAUDE.md`, "The backend is somewhere else").

Nothing here blocks the demo (M1 to M8) unless it says so.

## Decisions

The owner took requests 1 to 5 to Talaan on 2026-10-28. The reasons are in
the Talaan repository, `docs/PARENT-APP-REQUESTS.md`. The app work each one
needs is planned in `docs/PLAN.md`, "Waiting on the server".

**None of this is live yet.** The app keeps relying only on
`docs/TALAAN-API.md` until the owner says a server step is deployed. That
file is then refreshed from Talaan's `docs/PARENT-API.md`, and the app step
starts.

| # | Request | Decision | Server step |
|---|---|---|---|
| 1 | A new attendance `status` would hide a child | **Taken, as a promise:** no new values in `/api/v1`, no `statusLabel` | 59.6 |
| 2 | "Seen" separate from "read" | **Taken:** a per-parent seen time | 59.7 |
| 3 | A way to contact the school | **Replaced** by a Report button on a link notice | 59.8 |
| 4 | Filter the feed by child and by unread | **Dropped:** a today-only list is short enough | — |
| 5 | A push without the title "Bantay Aral" | **Taken:** no title on any push | 59.6 |
| — | The child's photo in a push | **Not asked for, agreed** | — |
| 6 | The notification list shows today only | **Taken** (the owner's own decision) | 59.7 |
| 7 | A range of days, for an attendance month | **Planned**, after the school calendar | 63.1 |

---

## 1. A new attendance `status` would hide a child completely

**Found:** 2026-10-25, during M5.

**Decided 2026-10-28: taken, as a promise (server Step 59.6).** `today.status`
and a day's status (`present`, `late`, `absent`, `idle`), a tap's `kind`
(`time_in`, `time_out`) and `school.notificationPreference` never gain a value
in `/api/v1`: a new value means `/api/v2`. No `statusLabel`. A new
notification `kind` can still appear, so the app keeps hiding kinds it doesn't
know, and keeps dropping a child it can't read. Holidays (Talaan Step 63,
later) arrive as `flexible: true` plus a new optional field, so the app's
"Came in" / "No tap" wording already covers them.

**What happens now.** `/me` answers with `children`, and each child's
`today.status` is one of `present`, `late`, `absent`, `idle`. The app checks
every child against that list and **drops any child it cannot read**, so one
unreadable child costs that child's card rather than the parent's whole
session.

That trade is right for a malformed answer. It is wrong for a status that is
simply *newer than the app*. If Talaan ever adds, say, `excused` or
`half_day`, then every phone already in a parent's hands stops showing that
child at all — no card, no error, no explanation. The parent sees a child
missing from their own home screen and has no way to know why.

Phones are not updated together. A parent who installed the app in June may
still be running it in December.

**What we'd like.** Either of these would do:

1. **A promise that the four statuses are fixed**, and that a new one goes
   out as `/api/v2` — the contract already says renaming or removing a field
   needs a new version, so this would just extend that rule to this enum.
2. **A fallback the app can show**: alongside `status`, a short
   `statusLabel` string the server has already worded ("Excused"). The app
   could then show an unknown status greyed, with the server's own words,
   instead of dropping the child.

(2) is more work on the server and much kinder to old phones, because it means
a new status never needs an app release at all.

**Until then.** The app keeps dropping unreadable children, and
`src/api/schemas.ts` says why. If a new status is ever added, expect reports of
children "disappearing" from the app.

---

## 2. "Seen" and "read" need to be different things

**Asked for:** 2026-10-26, by the owner, after using the feed.

**Decided 2026-10-28: taken (server Step 59.7).** A per-parent "seen" time,
set by `POST /api/v1/parents/notifications/seen`. The badge (`unreadCount`)
counts notifications newer than seen **and** still unread, so one the parent
opened from its push doesn't count. `read` stays shared by a child's
guardians. In the same step the list becomes today only (request 6).

**What they want**, and it is the right instinct — it is how Facebook, Gmail
and every notification bell a parent already knows behaves:

1. Opening the Notifications tab makes the **badge** go away.
2. Individual notifications **stay marked unread** until they are actually
   opened, so a parent can still see which ones are new.

**Why the app can't do that today.** The API has one flag, `read`, per
notification. Clearing the badge means marking things read, and marking things
read removes exactly the indicator point 2 asks for. One flag cannot be in two
states.

**And doing it anyway would reach into another parent's phone.** Read marks
are **shared by a child's guardians** (`docs/TALAAN-API.md:161`): "When one
parent reads it, it's read for the other too, and their `unreadCount` drops."

So "mark everything read when the bell is opened" would mean a father glancing
at his phone silently clears his wife's unread marks as well. She would open
the app that evening and find nothing new — for notifications she has never
seen. That is worse than the badge not clearing.

**What we'd like:** a per-parent **seen** marker, separate from the shared
`read` flag.

```
POST /api/v1/parents/notifications/seen   → 204
```

"Everything up to now has been put in front of *this* parent." Then:

- `unreadCount` counts notifications newer than that parent's `seen` marker
- `read` stays shared and per-notification, as it is now
- the badge clears for the parent who opened the bell, and for nobody else

`seen` is per parent because it describes *that phone's* owner looking at a
screen. `read` is shared because it describes the family having dealt with a
notification. They are genuinely different facts, which is why one flag cannot
carry both.

**Until then.** The badge clears as notifications are individually opened, and
"Mark all as read" clears it in one go — with the caveat above, which is worth
saying out loud to the owner before anyone uses it as a shortcut.

---

## 3. A way for a parent to contact the school: replaced by a Report button

**Found:** 2026-10-26, during M6.2.

**Decided 2026-10-28: replaced (server Step 59.8).** The owner dropped school
contact details: a number only helps if someone at the school answers, and
nobody there is set up to. The person who can act is the super admin, who
already removes a wrong link. So a link notice gets a **Report** button:

- `POST /api/v1/parents/notifications/:id/report`: only on a `guardian_linked`
  notice this parent received, once. A second report changes nothing.
- The notice's JSON gains `reportedAt` (`null` until reported).
- The advice becomes "If you don't know them, tap Report and we'll look into
  it." Once reported: "Reported. We'll check this link."
- The server emails the super admin, with no names in the email.
- `403 link_blocked` loses "Contact your child's school." and becomes "This
  child can't be linked to your account."

The rest of this entry is the original request, kept for the record.

**What happens now.** When another parent account links a child, the feed
says "If you don't know them, contact the school." (docs/TALAAN-API.md, the
feed). The same advice ends `403 link_blocked`: "Contact your child's school."
But the app can't offer a phone number or an email to contact, because **the
server doesn't store one at all**: there's no school contact setting in
Talaan, so there's nothing for the API to send.

A parent who has just learned that a stranger may have linked their child is
the one parent who most needs a number to call, right now.

**What we'd like, in two parts:**

1. **On the server first:** a school setting for a contact phone and/or email,
   edited by the principal in the web app's Settings.
2. **Then the API:** the school's contact on each child, beside its name.

```ts
school: {
  id: string;
  name: string;
  notificationPreference: "off" | "time_in_only" | "time_in_and_time_out";
  contact: { phone: string | null; email: string | null } | null; // new
};
```

With that, the notice could offer "Call Balanga City National Science High
School" (opening the dialler) or an email link, under the advice.

**Until then.** The advice stays as the contract words it. Nothing in the app
pretends to have a number.

---

## 4. Filter the feed by child, and by unread: dropped

**Found:** 2026-10-27, during M6.3a.

**Decided 2026-10-28: dropped.** Filters only matter on a long list. Once the
list is today only (request 6), it's a handful of lines for two or three
children. No chips.

**What happens now.** The owner's design shows chips above the feed: All,
one per child, and the app would want Unread too. `GET /notifications` has no
filter: it pages through every notice for every child, newest first, with an
opaque `nextBefore`.

Filtering in the app would break that paging. A parent tapping "Maria" would
see whatever of Maria's happened to be in the 30 rows loaded so far, possibly
none, and the app would have to keep pulling pages it then throws away, on
mobile data, to find more.

**What we'd like:** two optional query parameters, each narrowing the same
paged list, with `nextBefore` working as it does now:

```
GET /api/v1/parents/notifications?childId=student-0001
GET /api/v1/parents/notifications?unread=true
GET /api/v1/parents/notifications?childId=student-0001&unread=true
```

- `childId` must be one of this parent's linked children: anything else is
  `404`, as the read endpoints already answer.
- `unreadCount` stays the parent's total, so the badge doesn't change with a
  filter.

**Until then.** No chips. The feed is in sections by day, week and month
(M6.3a), which is what keeps it from being one long list.

---

## 5. A push without the title "Bantay Aral"

**Found:** 2026-10-28, by the owner, on the first real pushes after M7a.

**Decided 2026-10-28: taken (server Step 59.6).** No `title` key on any push.
Body, `data`, sound, channel `attendance` and priority stay the same. The
photo stays out of the push, as agreed below. Nothing changes in the app: the
second "Bantay Aral" simply stops arriving.

**What happens now.** Every push has the title "Bantay Aral" and a body like
"Juan tapped in at 7:56 AM" (`docs/TALAAN-API.md`, "What a push looks like").
Android already puts the app's name, Bantay Aral, at the top of every
notification next to its icon, so the phone shows the name twice:

```
(icon)  Bantay Aral · now
        Bantay Aral
        Juan tapped in at 7:56 AM
```

With the app closed, Android draws the push from what the server sent, so the
app can't remove the title itself.

**What we'd like:** no `title` on attendance pushes and link-notice pushes,
with the body, `data`, sound, priority and channel exactly as now:

```
(icon)  Bantay Aral · now
        Juan tapped in at 7:56 AM
```

On iOS (later), a push with no title shows the app's name in its place, so
nothing is lost there either.

**Not asked for: the child's photo in the push.** Expo can show a picture in a
push, but the phone downloads it from a plain link, without the parent's
token. That needs every child's photo at an address anyone holding the link
can open: a minor's face, outside the sign-in, and shown on a lock screen.
Making such links safe (signed, expiring) is new server work. The owner's rule
(2026-10-28): the photo only if it costs nothing, otherwise the name and time.

**Until then.** Pushes show the name twice. Nothing breaks.

---

## 6. The notification list shows today only

**Decided:** 2026-10-28, by the owner, in Talaan's Step 59.7. Not a request
from the app, but the app must follow it.

**What changes.** The bell says what happened today; the record of past days
moves to an Attendance tab. The server decides what's in the list, for both
the list and `unreadCount`, so the badge never counts something the list
doesn't show:

- **Today's taps**, on the school's clock.
- **Any `guardian_linked` notice still unread, whatever its day.** It's a
  safety warning and must not disappear at midnight.

A time out at 5 PM first looked at the next morning is gone from the list by
then. Accepted: the push already reached the phone, and Attendance will show
it.

**What it means for the app** (`docs/PLAN.md`, "Waiting on the server"): the
feed's sections by week and month (M6.3a) and its paging have nothing left to
do. The exact shape of the answer comes with the refreshed
`docs/TALAAN-API.md`.

---

## 7. A range of days, for an attendance month

**Decided:** 2026-10-28, planned as Talaan's Step 63.1.

**What exists now.** `GET /api/v1/parents/children/:id/taps?date=YYYY-MM-DD`
answers any past day: its status, `flexible`, and every tap with its kind. A
one-day screen can be built against it today.

**What a month needs.** One request for a range,
`GET /api/v1/parents/children/:id/attendance?from=&to=` (about a month at
most), each day's status, time in, latest tap and tap count. Without it a
month is about 22 requests on mobile data.

**Why it waits.** It comes after Talaan's school calendar (Step 63), so a
holiday or typhoon suspension never shows as Absent. A month of false Absents
would alarm parents. **Don't build the month view until then.**

