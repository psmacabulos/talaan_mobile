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
