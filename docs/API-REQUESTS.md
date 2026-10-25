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
