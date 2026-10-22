/**
 * The addresses the app calls, one typed function each.
 *
 * Each arrives with the step that needs it, so the app never carries code for
 * a screen that doesn't exist yet. M2 has only the school picker's list, which
 * is also the one address that needs no token — which makes it the simplest
 * proof that the whole pipeline works.
 */
import { request } from "./client";
import { schoolsResponseSchema, type School } from "./schemas";

/** Every Bantay Aral school, for the picker when linking a child (M4). */
export async function getSchools(): Promise<School[]> {
  const { schools } = await request({
    path: "/api/v1/parents/schools",
    auth: false,
    schema: schoolsResponseSchema,
  });

  return schools;
}
