# Step M6.4a — Home's child card, as designed

A reproducible checklist, written from the real diff.

**What you end with:** the child card from
`design/BantayAral Children Dashboard Comparison.png`: a status pill with an
icon, a times panel with coloured tiles, and a chevron, in light and dark.

```
┌──────────────────────────────────────────────┐
│ [photo]  Maria Ramos                       › │
│          Grade 7 – Rizal                     │
│          Balanga City National Science …     │
│          (✓ Present)                         │
│ ┌──────────────────────────────────────────┐ │
│ │ [→] Time in      │ [⇥] Out               │ │  ← stacks at fontScale ≥ 1.3
│ │     7:12 AM      │     4:05 PM           │ │
│ └──────────────────────────────────────────┘ │
│ 3 taps today                                 │
│ Your school sends: time in and time out      │
└──────────────────────────────────────────────┘
```

## 1. Icons (`src/components/icons/ui-icons.tsx`, new)

`ArrowInIcon`, `ArrowOutIcon`, `ClockIcon`, `CheckCircleIcon`,
`AlertCircleIcon`, `ChevronRightIcon`: 24-unit SVG paths, stroke 2, colour
passed in, `accessibilityElementsHidden` and
`importantForAccessibility="no-hide-descendants"`.

## 2. The tile (`src/components/icon-tile.tsx`, new)

40 × 40, `radius.md`, `background` from the caller, the icon drawn in
`colors.card`.

| Half | Tile |
|---|---|
| Time in, before a tap | `status.idle.text` (grey) |
| Time in | `status.present.text` (green) |
| Out, or an older server's Time out | `status.timeOut.text` (blue, never red) |
| Back in | `status.present.text` |

## 3. The pill (`src/components/child/status-pill.tsx`)

`toneIcon(tone, tone.text)`: present → tick, late → clock, absent → "!",
idle and timeOut → none. The pill becomes a row with `gap: space.xs`.

## 4. The words (`src/children/status-words.ts`, `src/strings.ts`)

`latestTapWords` → `{ kind, label: "Out" | "Back in", time, spoken }`.
`strings.card.latestOut` and `latestBackIn` are now plain labels.

## 5. The card (`src/components/child/child-card.tsx`)

- Build `halves`: always the time in; then the latest tap from the second tap,
  or, for an older server without `latest`, the time out.
- `TimesPanel`: `colors.muted`, `radius.md`; `flexDirection` row with a 1-wide
  divider, or column with a 1-high one when `useLargeText()`
  (`src/lib/use-large-text.ts`: `fontScale >= 1.3`). Each half has a fixed
  `id` (`timeIn`, `latest`) for its key and test id, never its label.
- `TimeHalf`: tile, then the label (`xs`, muted) over the time (Lexend bold
  `md`, never truncated). `flex: 1` only in a row: in a column it can squash.
- A `ChevronRightIcon` in `mutedForeground` at the end of the top row.
- The notification sentence loses its top border.
- The spoken label is unchanged.

## 6. Skeleton (`src/app/(app)/(tabs)/home.tsx`)

`LoadingCards` becomes a column: the old row, then a 64-high panel bar.

## 7. Tests

- `src/components/child/__tests__/child-card.test.tsx`: labels and times as
  separate texts; a grey tile before any tap; blue Out and green time in
  (`toHaveStyle`); row vs column with `@/lib/use-large-text` mocked.
- `src/lib/__tests__/use-large-text.test.ts` (new): the 1.3 threshold, on the
  plain `isLargeText`. Don't mock all of `react-native` for it: the copy trips
  deprecation getters and the file silently runs no tests.
- `src/components/child/__tests__/status-pill.test.tsx` (new): an icon for
  present, late and absent; none for idle.
- `src/children/__tests__/status-words.test.ts`: the new shape.
- `src/theme/contrast.test.ts`: icon on tile and tile on panel ≥ 3:1, a time
  on the panel ≥ 4.5:1, both themes.

Build story: `docs/BUILD-LOG.md`, "M6.4a".
