/**
 * What the "link a child" form accepts, from docs/PRODUCT-RULES.md,
 * "Form field rules".
 *
 * The birth date is held as a `Date` because it comes from a picker and is
 * never typed free-hand. It becomes `YYYY-MM-DD` only at the moment of
 * sending, through `toCalendarDate` — see that file for why `toISOString()`
 * would quietly send the wrong day.
 */
import { z } from "zod";

import { strings } from "@/strings";

export const linkChildFormSchema = z.object({
  schoolId: z.string().min(1, strings.fields.schoolRequired),
  /** Exactly 12 digits. The number keyboard makes anything else unlikely. */
  lrn: z
    .string()
    .trim()
    .regex(/^\d{12}$/, strings.fields.lrnInvalid),
  lastName: z.string().trim().min(1, strings.fields.childLastNameRequired),
  birthDate: z.date({ error: strings.fields.birthDateRequired }),
});

export type LinkChildForm = z.infer<typeof linkChildFormSchema>;
