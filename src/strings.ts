/**
 * Every word a parent reads, in one place, ready for a Filipino translation
 * later (CLAUDE.md, "UX quality bar"). Don't build translation yet.
 *
 * Plain, friendly English in sentence case. Words that describe attendance
 * are fixed by docs/PRODUCT-RULES.md, "The words to use" — they match the
 * school's web app exactly, so parents and staff never see two names for the
 * same thing.
 *
 * The field messages below are the server's own, copied from
 * docs/PRODUCT-RULES.md, "Form field rules". The app checks as the parent
 * types; the server checks again and sends these same words back.
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
    submitting: "Signing in…",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
  },

  signUp: {
    heading: "Create your account",
    subheading: "One account covers every child, at any Bantay Aral school.",
    firstNameLabel: "First name",
    firstNamePlaceholder: "Juan",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Dela Cruz",
    mobileLabel: "Mobile number",
    mobilePlaceholder: "09171234567",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Type it again",
    submit: "Sign up",
    submitting: "Creating your account…",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    /** A 409 means the email is taken: offer the way forward, not a dead end. */
    signInInstead: "Sign in instead",
  },

  /**
   * Exactly the messages in docs/PRODUCT-RULES.md, "Form field rules", so a
   * parent sees the same words whether the app or the server caught it.
   */
  fields: {
    firstNameRequired: "Enter a first name",
    lastNameRequired: "Enter a last name",
    mobileInvalid: "Enter a valid PH mobile number, e.g. 09171234567",
    emailInvalid: "Enter a valid email address",
    passwordTooShort: "Use at least 8 characters",
    passwordTooLong: "Use 128 characters or fewer",
    passwordRequired: "Enter your password",
    confirmPasswordRequired: "Confirm your password",
    passwordsDoNotMatch: "Passwords don't match",
    schoolRequired: "Select your child's school",
    lrnInvalid: "LRN must be exactly 12 digits",
    childLastNameRequired: "Enter your child's last name",
    birthDateRequired: "Enter your child's birth date",
  },

  common: {
    close: "Close",
  },

  /** Month names, so dates never depend on the phone's locale. */
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],

  linkChild: {
    heading: "Link your child",
    subheading:
      "These details are checked against the school's records. They are sent once and never shown again.",
    schoolLabel: "School",
    schoolPlaceholder: "Choose a school",
    schoolPickerTitle: "Your child's school",
    schoolsFailed: "Couldn't load the schools.",
    lrnLabel: "LRN",
    lrnPlaceholder: "12 digits",
    lrnHint: "The Learner Reference Number on your child's school records.",
    lastNameLabel: "Child's last name",
    lastNamePlaceholder: "Pascual",
    birthDateLabel: "Date of birth",
    birthDatePlaceholder: "Choose a date",
    submit: "Link my child",
    submitting: "Linking…",
    cancel: "Cancel",
    /** A 404 means nothing matched all four details. The app must not guess which. */
    checkTheseAgain:
      "Check the school, the LRN, the last name and the date of birth. All four must match the school's records.",
    linked: "Linked",
  },

  child: {
    /**
     * "Grade 7 – Rizal", with an en dash (docs/PRODUCT-RULES.md, "The words to
     * use"). A function rather than a sentence, because a translation will want
     * to put the pieces in its own order.
     */
    gradeAndSection: (gradeLevel: number, section: string) =>
      `Grade ${gradeLevel} – ${section}`,
  },

  home: {
    yourChildren: "Your children",
    noChildren: "No children linked yet.",
    noChildrenHint: "Link a child to see when they arrive at school.",
    addChild: "Link a child",
  },

  session: {
    /** The landing screen until M5 replaces it with Home. */
    greeting: "You're signed in",
    signOut: "Sign out",
    signingOut: "Signing out…",
    checking: "Checking your sign-in…",
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
