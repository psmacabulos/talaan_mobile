/**
 * Every answer from the server is checked here before the app uses it
 * (CLAUDE.md, "Validate every answer").
 *
 * `z.object` drops keys it doesn't know, which is exactly what the contract
 * asks for: "a new field may be added at any time, since the app ignores
 * fields it doesn't know" (docs/TALAAN-API.md). So a field added by the server
 * can never break a phone already in a parent's hands.
 *
 * Schemas arrive with the step that needs them. M2 only talks to
 * `GET /schools`, so only that shape is here.
 */
import { z } from "zod";

/** The one error shape every failure uses (docs/TALAAN-API.md, "Errors"). */
export const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    // Zod 4 needs both the key and the value schema; the one-argument form
    // runs but fails `tsc`.
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

/** `GET /api/v1/parents/schools` → `200 { schools: [{ id, name }] }` */
export const schoolSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type School = z.infer<typeof schoolSchema>;

export const schoolsResponseSchema = z.object({
  schools: z.array(schoolSchema),
});

/** The parent themselves (docs/TALAAN-API.md:67). */
export const parentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  mobile: z.string(),
});

export type Parent = z.infer<typeof parentSchema>;

/** `POST /signup` → `201 { token, parent }`, `POST /login` → `200` the same. */
export const authResponseSchema = z.object({
  token: z.string(),
  parent: parentSchema,
});

export type AuthResult = z.infer<typeof authResponseSchema>;

/**
 * `GET /me` → `{ parent, children: [ChildToday] }`.
 *
 * Only `parent` is described here. Zod drops `children` on the way through,
 * which is deliberate: M3 has no use for it, and an unexpected child shape
 * must never be able to stop a parent signing in. M5 adds it when Home needs
 * it.
 */
export const meResponseSchema = z.object({
  parent: parentSchema,
});
