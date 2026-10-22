/**
 * Every word a parent reads, in one place, ready for a Filipino translation
 * later (CLAUDE.md, "UX quality bar"). Don't build translation yet.
 *
 * Plain, friendly English in sentence case. Words that describe attendance
 * are fixed by docs/PRODUCT-RULES.md, "The words to use" — they match the
 * school's web app exactly, so parents and staff never see two names for the
 * same thing.
 */
import { PRODUCT_NAME } from "./product";

export const strings = {
  brand: {
    name: PRODUCT_NAME,
    tagline: "Every school day, connected with care.",
    /** One label for the whole logo; the mark itself is decorative. */
    logoLabel: PRODUCT_NAME,
  },

  signIn: {
    heading: "Welcome back",
    subheading: "Sign in to see your child's school day.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    submit: "Sign in",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
  },

  /**
   * What a parent reads when something fails on our side. The server's own
   * errors are shown exactly as they arrive — they are already plain,
   * friendly English (docs/PRODUCT-RULES.md, "Validate every answer").
   */
  errors: {
    noAnswer:
      "Can't reach Bantay Aral right now. Check your internet connection and try again.",
    unexpected: "Something went wrong. Please try again.",
    tryAgain: "Try again",
  },
} as const;
