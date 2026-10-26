# Design questions

`design/BantayAral Parent App UI Mockup.png` read against `docs/TALAAN-API.md`, `docs/PRODUCT-RULES.md` and `docs/PLAN.md`, on 2026-10-21.

`docs/DESIGN.md` says: "When the design breaks a rule below, don't copy it silently. Say what conflicts and propose the closest version that passes." This file is that list. The design is good and most of it builds as drawn — these are the places where it and the server disagree, and the server wins.

**All rows are now checked against the contract** (`docs/TALAAN-API.md`, copied from Talaan 2026-10-21). The shapes that decide most of this:

```ts
type ChildToday = {
  id; firstName; lastName;
  gradeLevel: number;   // 7 to 12 — a high school system
  section: string;      // "Rizal"
  photo: string | null;
  school: { id; name; notificationPreference: "off" | "time_in_only" | "time_in_and_time_out" };
  today: { date; status: "present" | "late" | "absent" | "idle"; flexible; timeIn; timeOut; tapCount };
};

type Item = { id; childId; childName; kind: "time_in" | "time_out"; at; read };
```

That is everything a parent's phone can ever receive about a child.

## Decisions needed before the step that builds the screen

| # | Screen | What the design shows | What the contract says | Proposed | By | Decision |
|---|---|---|---|---|---|---|
| 1 | 2. Sign Up | One "Full Name" field | `POST /signup` takes `{ firstName, lastName, mobile, email, password }` — **mobile is required and the design has no field for it** | Split the name in two, add Mobile | M3 | |
| 2 | 2. Sign Up | "Confirm Password" | Correct to keep: "There's no `confirmPassword`; the app checks that itself if it asks twice" | Keep, validate in the app only | M3 | |
| 3 | 3. Log In | "Continue with Google" / "Continue with Apple" | Only `/signup` and `/login`, email + password. No OAuth anywhere | Drop for the demo; `docs/API-REQUESTS.md` if you want it later | M3 | |
| 4 | 3. Log In | "Forgot password?" | Not in the contract. `PLAN.md` M3: "No 'Forgot password?' link yet"; `PRODUCT-RULES.md`: "never a link that leads nowhere" | Remove until Talaan Step 55.5 | M3 | |
| 5 | 3. Log In | "Remember me" | The token is always kept and lasts 30 days from last use. Nothing to remember or forget | Remove | M3 | |
| 6 | 4. Dashboard | "Arrived at school", "In Class / Since 7:45 AM" | `status` is only `present` / `late` / `absent` / `idle`. There is no "in class" | Present / Late / Absent / Not yet tapped (weekend: "Came in" / "No tap"). Layout unchanged, words only | M5 | |
| 7 | 4, 7, 9 | "Grade 5 – Section A", "Grade 2 – Section B" | **`gradeLevel` is 7 to 12.** Bantay Aral is a high school system — these children can't exist | Use real values, joined with an en dash: "Grade 7 – Rizal" | M5 | |
| 8 | 7. Child Details | "RFID Card ID 04A8F2B1" | "What the app never receives: … the card serial." Enforced by a key test on the server | **Remove.** A privacy rule, not a preference | M5 | |
| 9 | 7. Child Details | "Student ID STU-2024-001" | Not in `ChildToday`. The LRN is never sent either | Remove | M5 | |
| 10 | 7. Child Details | "Homeroom Teacher Ms. Reyes" | Not in `ChildToday` | Remove, or request it in `docs/API-REQUESTS.md` | M5 | |
| 11 | 7. Child Details | "Active" badge | No such field | Drop, or show today's status instead | M5 | |
| 12 | 8. Notifications | "School Announcement — No classes tomorrow" | `Item.kind` is only `time_in` or `time_out`. Suspensions are Talaan Step 63 | Attendance only for the demo; `API-REQUESTS.md` for announcements | M6 | |
| 13 | 8. Notifications | "Maria is now in class" | Not a notification the server sends | Remove | M6 | |
| 14 | 8. Notifications | Per-child filter chips (All / Maria / Miguel) | The feed is one list across all children, paged by an opaque cursor. Filtering client-side would break paging | Drop the chips for the demo, or request a `childId` filter | M6 | |
| 16 | 8. Notifications | The time on the right of **every** row | Tap rows say the time inside the sentence ("Juan Cruz tapped in at 7:56 AM", the contract's wording), and the day on the right only when it isn't today. The `guardian_linked` notice (M6.2) has its time on the right, as the mockup does | Keep for now; decide whether tap rows move their time to the right too | after demo | |
| 15 | 10. Profile | "Notification Settings" as a parent setting | `notificationPreference` is **per school, set by the principal**. Parents can't change it | Read-only: "Your school sends: time in and time out" | after demo | |

## Resolved — no longer open

| Question | Answer from the contract |
|---|---|
| Is there an attendance history across a date range? | **No range endpoint.** `/me` is "only today's taps, never a history". But `GET /children/:id/taps?date=YYYY-MM-DD` takes **any single past date**, so a *pick-a-date* view works today. A month grid with a mark on every day would be ~30 requests — that needs a new endpoint first (see below) |
| Does the API send a student id or card number? | No. Neither, by design, with a test on the server enforcing the exact keys |
| Is the unread badge count unbounded? | No, `unreadCount` stops at 10. Show "9+" from 10 |

## Still open

| Question | Why it matters | Decision |
|---|---|---|
| **Screen 6, Attendance History** — do you want the month calendar after the demo? | It needs a new Talaan endpoint (a date range per child). That's an `docs/API-REQUESTS.md` entry and a step in the Talaan repository, so it's worth deciding early even though it's post-demo | |
| **The 5-tab bar** (Home, Attendance, Children, Notifications, Profile) vs the demo's four screens | Decides the navigation shape in M5, awkward to change later | Suggest: build all 5 tabs now, ship Attendance and Profile thin for the demo | |
| **"Today's Summary"** (2 Present / 0 Late / 0 Absent) | `CLAUDE.md`: "This app holds no business rules." Counting statuses the server already decided is display, not a rule | Suggest: build it by counting what `/me` returns | |
| Do you want Google / Apple sign-in later, or drop the idea? | | |
| Own app icon and splash, or generate from `reference/mark-shapes.ts`? | | |

## Missing from the design (defaults will be used)

`docs/DESIGN.md`: "Where the design says nothing … use the defaults below, and tell the owner what you chose."

- **The link-a-child form.** Screen 9 has "+ Add Child" but not the form behind it: school picker (`GET /schools`), LRN, last name, birth date. Needed in M4.
- **The push permission ask,** right after the first child is linked.
- **Loading, empty and error states** for every screen — all three are required by the `CLAUDE.md` quality bar.
- **Dark mode.** Every mockup screen is light; `docs/DESIGN.md` has the dark tokens.
- **Android conventions.** The mockups are iPhone frames (screen 5 is an iOS lock screen). Android-first means Material back behaviour, 48-point targets, and the real Android notification shade.
- **A child with no photo.** `photo` is nullable — every mockup child has one. Needs an initials fallback.
