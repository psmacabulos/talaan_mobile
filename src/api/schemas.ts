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
