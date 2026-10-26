# Step M6.1 — The latest tap on the child's card

A reproducible checklist, written from the real diff.

**What you end with:** a child's card shows the time in, then from the second
tap on "Out 4:05 PM" or "Back in 7:05 PM". A child who left and came back no
longer looks like one who never moved.

```
GET /me ─► today: { timeIn, timeOut, tapCount, latest: { at, kind } | null }
                │
                ▼
     childTodaySchema (latest optional, .catch(undefined))
                │
                ▼
     latestTapWords(today) ─► { text: "Back in 7:05 PM",
                │               spoken: "Back in at 7:05 PM" } | undefined
                ▼
     ChildCard:  Time in 11:09 AM
                 Back in 7:05 PM
                 13 taps today
```

## 1. The contract first

```bash
cp ~/Documents/talaan/docs/PARENT-API.md docs/TALAAN-API.md
grep -n latest docs/TALAAN-API.md     # line 86, and the /me example
```

The contract wins over every other file, so the field isn't added until it's
there.

## 2. The schema (`src/api/schemas.ts`, inside `today`)

```ts
latest: z
  .object({
    at: z.string(),
    kind: z.enum(["time_in", "time_out"]),
  })
  .nullable()
  .optional()
  .catch(undefined),
```

- `null`: no tap today.
- `undefined`: an older server, or a value the app can't read. Without the
  `.catch`, one odd value drops the child's whole card through `tolerantArray`.

## 3. The strings (`src/strings.ts`, `card`)

```ts
latestOut: (time: string) => `Out ${time}`,
latestBackIn: (time: string) => `Back in ${time}`,
latestOutSpoken: (time: string) => `Out at ${time}`,
latestBackInSpoken: (time: string) => `Back in at ${time}`,
```

"Back in", never "In": a time in after the first means the child left and
came back, and a plain "In" reads like the arrival.

## 4. The words (`src/children/status-words.ts`)

```ts
export function latestTapWords(
  today: Pick<Today, "tapCount" | "latest">,
): LatestTapWords | undefined {
  const { tapCount, latest } = today;
  if (tapCount < 2 || latest === null || latest === undefined) return undefined;

  const time = formatSchoolTime(latest.at);
  if (time === undefined) return undefined;

  switch (latest.kind) {
    case "time_out":
      return { text: strings.card.latestOut(time), spoken: strings.card.latestOutSpoken(time) };
    case "time_in":
      return { text: strings.card.latestBackIn(time), spoken: strings.card.latestBackInSpoken(time) };
  }
}
```

With one tap the latest is the time in, already on the card, so it says
nothing. The kind is the server's.

## 5. The card (`src/components/child/child-card.tsx`)

- `hasLatest = child.today.latest !== undefined`. When true, no "Time out"
  column. When false (older server), the M5 layout, unchanged.
- Under the time in, `latest.text` in `fontFamily.heading`, `colors.foreground`,
  `fontSize.sm`. No status colours: the card's times never used them.
- "N taps today" (more than 2 taps) unchanged on screen, and now also in the
  spoken label, after `latest.spoken`.

## 6. Tests

- `src/components/child/__tests__/child-card.test.tsx` (new): no tap, one tap,
  in-out, in-out-in (13 taps, "Back in 7:05 PM"), an older server, and what
  TalkBack hears. The photo is `null` and `@/api/token` is mocked.
- `src/children/__tests__/status-words.test.ts`: `latestTapWords`, including
  taps with no `latest` and an `at` that isn't a time.
- `src/children/__tests__/link-child.test.ts`: `latest` missing, read, an
  unknown kind and a bad shape, each keeping the child.

```bash
npx jest src/components/child src/children
```

## 7. Docs

`docs/PRODUCT-RULES.md` ("The words to use"), `docs/PLAN.md` (Step M6.1, and
M5's wording), `docs/PROBLEMS-LOG.md` P-012. Build story:
`docs/BUILD-LOG.md`, "M6.1".
