/**
 * Every colour in the app. Components never write a colour literal: they take
 * a token from here (docs/DESIGN.md, rule 1, enforced by
 * scripts/check-color-literals.mjs).
 *
 * This file imports nothing, so app.config.ts can read it too. Keep it that
 * way: a React Native import here would break the config.
 *
 * The values are Talaan's web app tokens, so the app and the parent portal
 * look like one product (docs/DESIGN.md, "Defaults, from the web app").
 */

export type ColorScheme = "light" | "dark";

/** Colours that change between light and dark. */
export type SemanticColors = {
  /** The screen behind everything. */
  background: string;
  /** Main text. */
  foreground: string;
  /** Cards and sheets. */
  card: string;
  /** Main buttons, the brand. */
  primary: string;
  /** Text on `primary`. */
  primaryForeground: string;
  link: string;
  /** The brand's yellow, used sparingly. */
  highlight: string;
  /** Quiet surfaces. */
  muted: string;
  /** Secondary text. */
  mutedForeground: string;
  /** Dividers and card edges. */
  border: string;
  /** Sign out, delete. */
  destructive: string;
  /** Loading placeholders. The same value as `muted`, named for its job (M5). */
  skeleton: string;
};

export const semantic: Record<ColorScheme, SemanticColors> = {
  light: {
    background: "#F4F7FB",
    foreground: "#12213F",
    card: "#FFFFFF",
    primary: "#223060",
    primaryForeground: "#FFFFFF",
    link: "#1B77A5",
    highlight: "#F9E322",
    muted: "#E8EEF6",
    mutedForeground: "#5B6B84",
    border: "#DFE6F0",
    destructive: "#B92A32",
    skeleton: "#E8EEF6",
  },
  dark: {
    background: "#0D1526",
    foreground: "#E9EFFA",
    card: "#141F36",
    primary: "#60A0C0",
    primaryForeground: "#08111F",
    link: "#82B4CE",
    highlight: "#F9E322",
    muted: "#1E2B45",
    mutedForeground: "#9BABC6",
    border: "#243250",
    destructive: "#FF8B91",
    skeleton: "#1E2B45",
  },
};

/**
 * A status always means the same thing, in every theme, and is never reused
 * for anything else (docs/DESIGN.md, rule 2). Brand green is not "present".
 * Colour never carries the meaning alone: the pill always shows its words
 * too (rule 3).
 */
export type StatusName = "present" | "late" | "absent" | "idle" | "timeOut";

export type StatusColors = { text: string; background: string };

export const status: Record<ColorScheme, Record<StatusName, StatusColors>> = {
  light: {
    present: { text: "#157A45", background: "#E2F5EA" },
    late: { text: "#8A5A00", background: "#FFF0C7" },
    absent: { text: "#B92A32", background: "#FDE6E7" },
    idle: { text: "#52627C", background: "#E8EEF6" },
    timeOut: { text: "#2058D4", background: "#E7F2FF" },
  },
  dark: {
    present: { text: "#5EDB98", background: "#12382A" },
    late: { text: "#FFD166", background: "#3A2E10" },
    absent: { text: "#FF8B91", background: "#40191C" },
    idle: { text: "#A9B7CE", background: "#1E2B45" },
    timeOut: { text: "#88BCFF", background: "#182B4F" },
  },
};

/**
 * The logo's own colours, the same at every school. The mark's green
 * (`child`) is too light for text, so text uses `greenText`.
 */
export type BrandColors = {
  parentTop: string;
  parent: string;
  child: string;
  pageLight: string;
  pageDeep: string;
  edge: string;
  sun: string;
  /** "Bantay" in the wordmark. */
  ink: string;
  /** "Aral", and any green text. */
  greenText: string;
};

export const brand: Record<ColorScheme, BrandColors> = {
  light: {
    parentTop: "#2F80D0",
    parent: "#1149A6",
    child: "#2FA866",
    pageLight: "#6CC896",
    pageDeep: "#126A5C",
    edge: "#FFFFFF",
    sun: "#F8B014",
    ink: "#0A2552",
    greenText: "#1A7F48",
  },
  dark: {
    parentTop: "#FFFFFF",
    parent: "#C9D6EA",
    child: "#2FA866",
    pageLight: "#6CC896",
    pageDeep: "#3FA57A",
    edge: "#0D1526",
    sun: "#F8B014",
    ink: "#E9EFFA",
    greenText: "#4CC98A",
  },
};

/** The app icon and splash screen sit on white in both themes (docs/DESIGN.md). */
export const ICON_BACKGROUND = "#FFFFFF";
