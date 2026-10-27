# Step M6.3a — The notifications, grouped

A reproducible checklist, written from the real diff.

**What you end with:** the Notifications tab in sections (Today, Yesterday,
Earlier this week, Earlier this month, then months), each row's time on the
right, and a list bottom that says when it's the end or when older ones
failed.

```
useFeed() pages ──┐
                  ├─► useMemo(groupFeed(items, today)) ─► SectionList
useSchoolToday() ─┘         │                               ├ FeedSectionHeader (sticky, heading)
  (AppState active,         └ section.bucket ──────────────►├ FeedRow (memo) ─► feedWords(item, bucket)
   pull to refresh)                                         └ footer: spinner | olderFailed | endOfFeed
```

## 1. Dates without the phone's zone (`src/lib/school-time.ts`)

New helpers, all reading the school's clock:

- `schoolDateOrUndefined(iso)`: `schoolDateOf` throws on an invalid time; a
  list must not.
- `formatSchoolWeekday` ("Monday"), `formatSchoolWeekdayShort` ("Mon"),
  `formatSchoolDateShort` ("Oct 14"), from `strings.weekdays`,
  `strings.weekdaysShort` and `strings.monthsShort`.

## 2. One "today" per screen (`src/lib/use-school-today.ts`)

`useState(readToday)`, read again on `AppState` "active" and by the returned
`refresh` (called on pull to refresh). A screen left open across midnight
keeps yesterday's "today" until one of those happens: accepted, since a parent
reopening the app or pulling down is the moment it matters.

## 3. Grouping (`src/feed/feed-groups.ts`)

```ts
const sinceMonday = (new Date(todayNumber * DAY_MS).getUTCDay() + 6) % 7;
const monday = dateOfDay(todayNumber - sinceMonday);

if (date >= today) return today;          // a clock slightly ahead is today
if (date === yesterday) return yesterday;
if (date >= monday) return thisWeek;      // weeks start Monday
if (sameMonth) return thisMonth;
return month "YYYY-MM";
```

Sections live in a `Map` by key; "Date unknown" goes last.

## 4. Words by section (`src/feed/feed-words.ts`)

`feedWords(item, bucket)` → `{ text, detail?, when, spoken, opensChildDay }`.
`text` has no time ("Juan Cruz tapped in"); `when` is "7:12 AM", "Mon 7:30
AM" or "Oct 14, 4:10 PM"; `spoken` is "Juan Cruz tapped in at 7:12 AM,
today|yesterday|Monday|Monday, October 19".

## 5. The row (`src/components/feed/feed-row.tsx`)

`memo`, a `bucket` prop, label `Unread. ` + `spoken`. The time on the right is
Lexend, `sm`, `mutedForeground`, `flexShrink: 0`, so the sentence wraps
instead of the time.

## 6. The header (`src/components/feed/feed-section-header.tsx`)

`accessibilityRole="header"`, solid `background` (it sticks over rows).

## 7. The screen (`src/app/(app)/(tabs)/notifications.tsx`)

`FlatList` → `SectionList` with `stickySectionHeadersEnabled` (off by default
on Android), `onRead={markRead.mutate}`, pull to refresh also refreshes
today, and the footer:

```tsx
!hasAny ? undefined
: feed.isFetchingNextPage ? <spinner />
: feed.isFetchNextPageError ? <FeedFailure message={strings.feed.olderFailed} onRetry={fetchNextPage} />
: !feed.hasNextPage ? <EndOfFeed />
: undefined
```

**After a failure, only Try again asks.** `loadMore` returns early on
`feed.isFetchNextPageError`: otherwise the footer swapping between spinner and
error changes the list's length, `onEndReached` fires again, and offline it
loops.

## 8. Tests

- `src/feed/__tests__/feed-groups.test.ts`: every section, Monday and Sunday,
  a week across two months, New Year, a row out of order, an unreadable time.
- `src/feed/__tests__/feed-words.test.ts`: the time and spoken day per
  section, the notice.
- `src/components/feed/__tests__/feed-row.test.tsx`: the sentence and time,
  the spoken label.
- `src/__tests__/notifications-screen.test.tsx`: a header role, the end, no
  end with more to load, a failed next page keeping its rows and retrying,
  and the list's end asking for more only when it should
  (`fireEvent(screen.getByTestId("feed-list"), "endReached")`).

Build story: `docs/BUILD-LOG.md`, "M6.3a".
