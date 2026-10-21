/**
 * The product's name, in one place.
 *
 * Everything a parent sees says "Bantay Aral": the app's name on the phone,
 * the sign-in screen, and every notification. "Talaan" is the backend's code
 * name and is never shown to a parent (CLAUDE.md, "Two names, on purpose").
 */
export const PRODUCT_NAME = "Bantay Aral";

/** The Android package and iOS bundle id. Permanent once published. */
export const APP_ID = "com.bantayaral.parent";

/**
 * The wordmark shows the name in two colours, joined: "Bantay" in the brand's
 * ink and "Aral" in its green (docs/DESIGN.md, "The logo"). It lives here
 * rather than in src/strings.ts because a brand name is never translated.
 */
export const WORDMARK = { first: "Bantay", second: "Aral" } as const;
