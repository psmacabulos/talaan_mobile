/**
 * Expo's global types, referenced from a file that is actually committed.
 *
 * Expo generates `expo-env.d.ts` at the project root with this same line, and
 * its own template puts that file in `.gitignore` — so it exists on a
 * developer's machine and **never exists in CI**. Without it `tsconfig.json`'s
 * `"types": ["jest"]` leaves TypeScript with a different set of globals, and
 * the two disagree: code can typecheck cleanly here and fail on a push
 * (docs/PROBLEMS-LOG.md, P-010).
 *
 * This file is committed, so CI and a laptop check the same thing.
 */
/// <reference types="expo/types" />
