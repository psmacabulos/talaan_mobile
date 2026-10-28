# What the app needs from the API

Things this app wants that `docs/TALAAN-API.md` doesn't offer yet. The owner
takes these to the Talaan repository, where each becomes a step there
(`CLAUDE.md`, "The backend is somewhere else").

Nothing here blocks the demo (M1 to M8) unless it says so.

---

## 1. A new attendance `status` would hide a child completely

**Found:** 2026-10-25, during M5.

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

## 3. A way for a parent to contact the school

**Found:** 2026-10-26, during M6.2.

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

## 4. Filter the feed by child, and by unread

**Found:** 2026-10-27, during M6.3a.

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

## 5. A push without the title "Bantay Aral"

**Found:** 2026-10-28, by the owner, on the first real pushes after M7a.

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
