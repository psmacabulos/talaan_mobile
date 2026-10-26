# Step M6.2 — "Another parent linked your child" in the feed

A reproducible checklist, written from the real diff.

**What you end with:** when another parent account links a child, the parents
already linked see it in the feed, in the contract's words, with advice to
contact the school. Before this, the app dropped it while the badge counted it.

```
GET /notifications
  { kind: "time_in" | "time_out", … }                 ┐
  { kind: "guardian_linked", guardian: {…} | null, … } ├─► notificationSchema
  { kind: "something_new", … }  ── dropped ────────────┘   (discriminated union)
                                                              │
                                     feedWords(item, today) ◄─┘ exhaustive switch
                                     { text, detail?, when?, opensChildDay }
                                                              │
                                     FeedRow ◄────────────────┘
                                     ● 👤+ An account named Ana Santos linked   6:12 PM
                                           to Juan Cruz.
                                           If you don't know them, contact the school.
```

## 1. The schema (`src/api/schemas.ts`)

```ts
const notificationBase = z.object({
  id: z.string(), childId: z.string(), childName: z.string(),
  at: z.string(), read: z.boolean(),
});

export const notificationSchema = z.discriminatedUnion("kind", [
  notificationBase.extend({ kind: z.enum(["time_in", "time_out"]) }),
  notificationBase.extend({
    kind: z.literal("guardian_linked"),
    guardian: z
      .object({ firstName: z.string(), lastName: z.string() })
      .nullable()
      .optional()
      .catch(null),
  }),
]);
```

`.catch(null)`: a guardian the app can't read gives the wording without a
name. The notice itself must never be lost. A kind the app doesn't know still
fails and is dropped by `tolerantArray`, never shown as a tap.

## 2. The strings (`src/strings.ts`, `feed`)

The contract's words, exactly:

```ts
guardianLinked: (guardianName, childName) => `An account named ${guardianName} linked to ${childName}.`,
guardianLinkedNoName: (childName) => `A parent account linked to ${childName}.`,
guardianLinkedAdvice: "If you don't know them, contact the school.",
dayAndTime: (day, time) => `${day}, ${time}`,
opensChildDay: (childName) => `Opens ${childName}'s day`,
marksAsRead: "Marks it as read",
```

## 3. The words (`src/feed/feed-words.ts`, new)

`feedWords(item, today)` returns `{ text, detail?, when?, opensChildDay }`
from one switch on `item.kind`, ending in:

```ts
default: {
  const unhandled: never = item;
  return unhandled;
}
```

That line is what makes a new kind fail typecheck instead of disappearing.
Names are trimmed; blank on both halves gives the no-name wording. A notice
from an earlier day shows "Thursday, October 22, 6:12 PM", not just the day.

## 4. The row (`src/components/feed/feed-row.tsx`, new)

Moved out of `src/app/(app)/(tabs)/notifications.tsx` so it can be tested
(P-004). The screen now imports it.

- The notice gets `PersonPlusIcon` (`src/components/icons/feed-icons.tsx`,
  drawn with `react-native-svg`, hidden from screen readers), the advice on a
  second line in `mutedForeground`, and its time on the right.
- Pressing marks it read; only `words.opensChildDay` navigates.
- Always one `Pressable`. When a notice is read, role, hint and `onPress` go
  away, but the element stays, so TalkBack keeps its place.
- The spoken label strips each part's trailing full stop before joining with
  ". ".

## 5. Tests

- `src/feed/__tests__/feed.test.ts`: the notice with a name, `null`, no
  `guardian`, an unreadable `guardian`, mixed with taps.
- `src/feed/__tests__/feed-words.test.ts` (new): every kind's words, the
  no-name cases, half a name, an earlier day.
- `src/components/feed/__tests__/feed-row.test.tsx` (new): a tap opens the
  day; the notice shows its three parts, is read out once, marks read and
  stays; a read notice is no longer a button. `expo-router` is mocked with
  `mockPush` (Jest only allows `mock…` names in a mock factory).

## 6. Testing it on a phone

A notice goes only to parents already linked to the child. Link one of
parent-one's children (Maria Ramos or Carmen Sison, `docs/SERVER.md`) from a
throwaway account, never reused for that child: the link can't be undone by a
parent, and the principal removing it blocks that account for good. Full table
in `docs/PLAN.md`, Step M6.2.

Build story: `docs/BUILD-LOG.md`, "M6.2".
