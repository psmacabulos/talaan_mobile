# The Bantay Aral logo, as files

Exported on 2026-10-28 from the web app's vector mark (`talaan/src/components/brand/mark-shapes.ts`, colours from `src/lib/theme/brand.ts` and `src/styles/tokens.css`). Every PNG is drawn from the vector shapes, not cut out of the brand sheet, so it is sharp at its full size. All transparent unless the table says otherwise.

## The mark on its own

| File | Size | Use it for |
|---|---|---|
| `mark.svg` | vector | The mark in the app (for example with `react-native-svg`), light backgrounds |
| `mark-dark.svg` | vector | The same on dark backgrounds: the parent figure turns white and the page lines turn navy (`#0D1526`), as on the web in dark mode |
| `mark-mono.svg` | vector | One colour (black), page lines cut out. Recolour it freely |
| `logo-icon-only.png` | 1024 × 1024 | The file asked for: the full-colour mark centred on a square, with a small margin |
| `logo-icon-only-dark.png` | 1024 × 1024 | The same, dark-mode colours |
| `mark-tight.png`, `mark-tight-dark.png` | 1024 × 966 | The mark with no margin, for placing it in a layout |

## The full logo with its name

| File | Size | Use it for |
|---|---|---|
| `logo-full.png` | 2264 × 576 | The mark plus "BantayAral" in Lexend Bold ("Aral" in green), for light backgrounds. Same layout as the web's large logo |
| `logo-full-dark.png` | 2264 × 576 | The same for dark backgrounds |

The web draws the name as live text, not a picture, so screen readers hear "Bantay Aral". The app can do the same: the mark as an image, the name as text.

## App icon and splash (M8)

The names match the placeholders in `assets/images/`, so these files can replace them under the same names.

| File | Size | What it is |
|---|---|---|
| `icon.png` | 1024 × 1024, **opaque** | `icon`: the mark on white, 73% wide (as the web's iPhone icon). The App Store rejects transparent icons |
| `android-icon-foreground.png` | 1024 × 1024 | `adaptiveIcon.foregroundImage`: the mark, 60% wide, inside the circle Android always shows whatever mask the phone uses |
| `android-icon-background.png` | 1024 × 1024, white | `adaptiveIcon.backgroundImage`, the same as `ICON_BACKGROUND` |
| `android-icon-monochrome.png` | 1024 × 1024 | `adaptiveIcon.monochromeImage`: a white outline of the mark, for Android 13's themed icons (Android uses only its shape) |
| `splash-icon.png` | 1024 × 1024 | `expo-splash-screen`'s `image`. Set `imageWidth` to how wide it should look (for example 200) |

## Push

| File | Size | What it is |
|---|---|---|
| `notification-icon.png` | 96 × 96 | The status bar's small icon: a white outline of the mark on transparent. Android uses only its shape, so a full-colour icon turns into a white square. For `expo-notifications`' `icon` option |
| `notification-large-icon.png` | 192 × 192 | Full-colour mark, for the larger picture beside a notification, if a step needs one |

## Colours

| Part | Light | Dark |
|---|---|---|
| Parent (head → body gradient) | `#2F80D0` → `#1149A6` | `#FFFFFF` → `#C9D6EA` |
| Child, middle page | `#2FA866` | `#2FA866` |
| Left page | `#6CC896` | `#6CC896` |
| Front page | `#126A5C` | `#3FA57A` |
| Page lines | `#FFFFFF` | `#0D1526` |
| Sun's rays | `#F8B014` | `#F8B014` |
| "Bantay" | `#0A2552` | `#E9EFFA` |
| "Aral" | `#1A7F48` | `#4CC98A` |
