# Step M4 — Link a child

A reproducible checklist, written from the real diff.

**What you end with:** a parent enters a school, an LRN, a last name and a
birth date, and the child appears on their home screen.

## 1. Package

```powershell
npx expo install @react-native-community/datetimepicker
```

MIT, no account. Needed because `docs/PRODUCT-RULES.md` says the birth date is
"a date picker, never typed free-hand" — a parent typing `03/04/2014` can mean
two different days, and the server will only ever answer "no match".

**No package for the school picker.** Three schools is a `Modal` and a list,
and owning it keeps the design tokens, the 48-point targets and the
screen-reader behaviour identical to every other field.

## 2. The date bug to avoid

This is the one that matters. Never build the `YYYY-MM-DD` with
`toISOString()`:

```
TZ=Asia/Manila
parent picked      : Mon Mar 03 2014
via toISOString()  : "2014-03-02"   ← one day early, every time
via local fields   : "2014-03-03"
```

A date picker hands back **local midnight**, and local midnight in UTC+8 is
still the previous day in UTC. `2014-03-03` is the demo student's birth date
(`docs/SERVER.md`), so this alone would have made the demo fail.

```ts
export function toCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
```

Nothing in the failure points at a timezone: the server says `404 not_found`,
"no match", and the app is not allowed to show the birth date back. Write the
test.

## 3. `/me` gains children, tolerantly

M3 parsed only `parent` on purpose. Adding `children: z.array(childTodaySchema)`
would undo that — one child with a status the app doesn't know fails the whole
answer, and `/me` failing takes the signed-in app with it.

```ts
const tolerantChildren = z
  .array(z.unknown())
  .optional()
  .transform((items) =>
    (items ?? []).flatMap((item) => {
      const parsed = childTodaySchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    }),
  );
```

One unreadable child costs that child's row, not the parent's session.

**Declaration order matters.** `const` is not hoisted, so `tolerantChildren`
and `childTodaySchema` must appear *above* `meResponseSchema` in the file.

## 4. Read the `201` tolerantly too

A `201` means the link was made on the server. If the app then rejected the
body, the parent would see a failure for something that worked, retry, and be
told the child is **already linked**. So the child comes back as
`ChildToday | null` and the confirmation simply says less when it cannot be
read.

## 5. Refetch, don't seed

```ts
onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_KEY })
```

One cheap call, no chance of the cache drifting from what the server would say,
and it refreshes the 30-day token at the same time. Invalidate on a `409` too —
a stale list is the likeliest reason a parent tried to add the same child
twice.

## 6. What a `404` may say

It means nothing matched **all four** details, and the server does not say
which. Neither may the app. Show the server's own message, then one static
line naming all four things to check. "Check the birth date" would be a guess,
and wrong most of the time.

## 7. The iOS trap in the date picker

`src/components/form/date-field.tsx` is **Android-shaped on purpose**:

| | Android | iOS |
|---|---|---|
| `display="spinner"` | a dialog; `onChange` fires once | renders **inline** |
| each wheel tick | nothing | fires `onChange` with `type: "set"` |

So closing on the first event — correct on Android — would, on iOS, shut the
picker at the first nudge and commit a half-scrolled date. iOS needs a
`Platform.OS` branch with its own Done button before it ships. Nothing else in
the file is platform-specific, so that is a branch, not a rewrite.

## 8. Don't forget the deletion

M2's `src/components/dev/server-check.tsx` goes, along with its use in
`(auth)/sign-in.tsx`. The real school picker replaces the call it was proving.

## 9. Checks

```powershell
npm run lint
npm run typecheck
npm run check:colors
npm test
npx expo export --platform android
```

On the phone:

| Do | Expect |
|---|---|
| Link Jose Pascual (`100000000002`, Pascual, 3 March 2014) | the row appears on Home with no manual refresh |
| Link him again | the server's "already linked", clearly |
| Wrong birth date | the message **plus** the four-field line |
| Back out of the date spinner | nothing set, screen unchanged |
| Android back inside the school sheet | closes the sheet only, not the screen |
| Wi-Fi off on the link screen | the schools error with "Try again" |
| 200% font at 360pt, dark mode | everything reachable |
