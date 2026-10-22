/**
 * What the sign-up and sign-in forms accept.
 *
 * These are the server's own rules, copied from docs/PRODUCT-RULES.md, "Form
 * field rules". The app checks as the parent types so they aren't made to wait
 * for a round trip to be told a password is too short — but the server checks
 * again, and its `fields` messages are shown under the same fields when it
 * does. Both say the same words.
 *
 * Email is trimmed and lowercased here, so what the parent sees and what the
 * server stores can never drift apart over a stray capital or a space pasted
 * in from somewhere else.
 */
import { z } from "zod";

import { strings } from "@/strings";

/** `09XXXXXXXXX` or `+639XXXXXXXXX` (docs/PRODUCT-RULES.md). */
const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email(strings.fields.emailInvalid)
  .max(254, strings.fields.emailInvalid);

const newPassword = z
  .string()
  .min(8, strings.fields.passwordTooShort)
  .max(128, strings.fields.passwordTooLong);

export const signUpFormSchema = z
  .object({
    firstName: z.string().trim().min(1, strings.fields.firstNameRequired),
    lastName: z.string().trim().min(1, strings.fields.lastNameRequired),
    mobile: z.string().trim().regex(PH_MOBILE, strings.fields.mobileInvalid),
    email,
    password: newPassword,
    confirmPassword: z
      .string()
      .min(1, strings.fields.confirmPasswordRequired),
  })
  // The API has no `confirmPassword`; this check exists only here, which is
  // why the message lands on that field rather than on the password.
  .refine((values) => values.password === values.confirmPassword, {
    message: strings.fields.passwordsDoNotMatch,
    path: ["confirmPassword"],
  });

export type SignUpForm = z.infer<typeof signUpFormSchema>;

/**
 * Signing in checks only that something was typed. A password that is wrong,
 * or an account that doesn't exist, is the server's answer to give — the app
 * must never guess at it.
 */
export const signInFormSchema = z.object({
  email,
  password: z
    .string()
    .min(1, strings.fields.passwordRequired)
    .max(128, strings.fields.passwordTooLong),
});

export type SignInForm = z.infer<typeof signInFormSchema>;
