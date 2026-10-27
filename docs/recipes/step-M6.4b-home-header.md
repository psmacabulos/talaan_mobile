# Step M6.4b — Home's header, tab icons, and a card with only what matters

A reproducible checklist, written from the real diff.

**What you end with:** the top of Home from
`design/BantayAral Children Dashboard Comparison.png`, with the school as a
background; a card with only the name, grade, status and times; and tab icons
that fill when their tab is open. Two children fit without scrolling.

```
┌──────────────────────────────────────────────┐
│ [MARK] BantayAral          ░░[school]░░      │  ← Logo 52, wordmark xl;
│                            ░░░░░░░░░░░░      │    the school is absolute,
│ My children                ░░░░░░░░░░░░      │    behind, base level with
│ Check who's in school, the moment they tap in.│    the heading's bottom
│ ┌──────────────────────────────────────────┐ │
│ │ [ph]  Maria Ramos                      › │ │  ← photo 64 × 80
│ │ [ph]  Grade 7 – Rizal                    │ │
│ │ [ph]  (✓ Present)                        │ │  ← no school, no "sends"
│ │ ┌ [→] Time in 7:12 AM │ [⇥] Out 4:05 PM ┐│ │
│ └──────────────────────────────────────────┘ │
│ ┌ the second child ─────────────────────────┐│
└──────────────────────────────────────────────┘
   [■ Home]        [○ Notifications]              ← filled = open
```

## 1. The picture

Shrink the exported file to 3 times the size it's drawn at (120 points wide,
so 360 pixels), keeping transparency:

```bash
sips -Z 360 assets/images/illustration-school.png
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/illustration-school.png
# pixelWidth: 360, pixelHeight: 240, hasAlpha: yes — 105 KB
```

Always from the original. If the original is committed, take it from git
(`git show HEAD:assets/images/illustration-school.png > original.png`).

## 2. The words (`src/strings.ts`)

```ts
home: {
  heading: "My children",
  subheading: "Check who's in school, the moment they tap in.",
```

## 3. The logo (`src/components/brand/logo.tsx`)

A `wordmarkSize?: FontSize` prop, default `"lg"`, used as
`theme.fontSize[wordmarkSize]`. The sign-in screens keep the default.

## 3a. The header (`src/components/home/home-header.tsx`, new)

- An outer `View`, `gap: space.xs`, holding:
  - a block, `gap: space.md`, with, in this order:
    - unless `useLargeText()`, the picture: a `View` with
      `testID="home-illustration"`, `accessibilityElementsHidden`,
      `importantForAccessibility="no-hide-descendants"` and
      `{ position: "absolute", right: 0, bottom: 0 }`, holding an
      `expo-image` `Image`, `contentFit="contain"`, 120 × 80. First, so
      what follows is drawn on top;
    - `<Logo size={52} wordmarkSize={largeText ? "lg" : "xl"} />`: one
      word can't wrap, so at large text the wordmark is a size smaller;
    - the heading (`headingBold`, `fontSize.xl`,
      `accessibilityRole="header"`, no `numberOfLines`), with
      `paddingRight: 128` (the picture plus `space.sm`) while the picture
      shows, so it wraps rather than reach the trees;
  - the subheading (`body`, `fontSize.sm`, `mutedForeground`), full width.
- Why these numbers: BUILD-LOG, M6.4b, "Measuring before placing".
- The picture is `require("../../../assets/images/illustration-school.png")`,
  relative: `@/assets/…` works in Metro but not in Jest (BUILD-LOG, M6.4b).

## 4. Home (`src/app/(app)/(tabs)/home.tsx`)

Replace the heading `Text` with `<HomeHeader />`, in the same place inside
the `ScrollView`. In `LoadingCards`: the photo skeleton 64 × 80, no school
line, gaps `space.md`.

## 4a. The card (`src/components/child/child-card.tsx`)

- Remove the school's name `Text`, and the `notificationSentence(…)` line at
  the bottom. Remove `child.school.name` from the spoken label.
- `PHOTO_WIDTH` 64 (the photo is 4:5, so 80 tall); the card's and the top
  row's `gap` to `space.md`.
- Remove `notificationSentence` from `src/children/status-words.ts`, its
  tests, and `strings.card.sendsNothing`, `sendsTimeIn` and `sendsBoth`. The
  wording is kept in `docs/PRODUCT-RULES.md` for Profile.

## 5. The tab icons (`src/components/icons/tab-icons.tsx`)

A `focused?: boolean` prop. The main shape gets `fill={focused ? color :
"none"}`. The house's door is cut out of its path, so it stays open; the
bell's clapper stays a stroke. In `_layout.tsx`:

```tsx
tabBarIcon: ({ color, focused }) => (
  <HomeIcon color={color} focused={focused} />
),
```

## 6. Tests

- `src/components/home/__tests__/home-header.test.tsx`: the logo once, the
  heading role, the subheading; the heading's `paddingRight` 128 with the
  picture and 0 without; the picture not found normally but found with
  `includeHiddenElements`; gone when `useLargeText` is mocked true.
- `src/components/child/__tests__/child-card.test.tsx`: the grade and section
  shown, no "Balanga City" on screen or in the spoken label, no "school
  sends" line.
- `src/components/icons/__tests__/tab-icons.test.tsx`: focused, the fill
  equals the stroke; not focused, the fill is `null`.

## 7. Check

`npm run lint`, `npm run typecheck`, `npm test`, then `npx expo start --clear`
and the table in `docs/PLAN.md`, Step M6.4b.
