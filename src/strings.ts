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

  /** Weekday names, indexed by getUTCDay(): 0 is Sunday. */
  weekdays: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],

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

  /** Short forms for a feed row's time: "Mon 7:30 AM", "Oct 14, 4:10 PM". */
  weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monthsShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
    /** The tab's name; the screen's own heading is `heading`. */
    tabLabel: "Home",
    heading: "My children",
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

  /**
   * The status words, exactly as docs/PRODUCT-RULES.md, "The words to use"
   * lists them — the same words the school's staff see in the web app, so a
   * parent and a teacher never describe the same morning differently.
   *
   * At weekends (`today.flexible`) a school has no late and no absent, so a
   * child who came in "Came in" rather than "Present", and one who did not has
   * "No tap" rather than the accusing "Not yet tapped".
   */
  status: {
    present: "Present",
    late: "Late",
    absent: "Absent",
    idle: "Not yet tapped",
    presentAtWeekend: "Came in",
    idleAtWeekend: "No tap",
  },

  card: {
    timeIn: "Time in",
    timeOut: "Time out",
    /** A time that has not happened yet. */
    noTime: "—",
    /**
     * The newest tap, from the second tap on (docs/PRODUCT-RULES.md). A time
     * in after the first always means the child left and came back, so it is
     * "Back in", never a plain "In" that reads like the arrival.
     */
    latestOut: (time: string) => `Out ${time}`,
    latestBackIn: (time: string) => `Back in ${time}`,
    latestOutSpoken: (time: string) => `Out at ${time}`,
    latestBackInSpoken: (time: string) => `Back in at ${time}`,
    /** Shown only when there are more than two taps: they left and came back. */
    tapsToday: (count: number) => `${count} taps today`,
    photoOf: (firstName: string) => `${firstName}'s photo`,
    /**
     * The principal sets this for every parent at the school and parents
     * cannot change it (docs/PRODUCT-RULES.md). Saying it on the card is how a
     * parent knows whether to expect a notification at home time.
     */
    sendsNothing: "Your school doesn't send notifications",
    sendsTimeIn: "Your school sends: time in",
    sendsBoth: "Your school sends: time in and time out",
  },

  feed: {
    title: "Notifications",
    tabLabel: "Notifications",
    /** The badge caps at 10, because the server's count does. */
    badgeOverflow: "9+",
    unreadTab: (count: number) =>
      count === 0
        ? "Notifications"
        : `Notifications, ${count === 10 ? "10 or more" : count} unread`,
    markAllRead: "Mark all as read",
    markingAllRead: "Marking…",
    empty: "Nothing yet.",
    emptyHint:
      "When your child taps their ID card at the gate, it will show up here.",
    /**
     * docs/PRODUCT-RULES.md, "The words to use": a feed row says the sentence,
     * with the time on the right; a screen reader hears the time in it.
     */
    tappedIn: (childName: string) => `${childName} tapped in`,
    tappedOut: (childName: string) => `${childName} tapped out`,
    tappedInAt: (childName: string, time: string) =>
      `${childName} tapped in at ${time}`,
    tappedOutAt: (childName: string, time: string) =>
      `${childName} tapped out at ${time}`,
    /** The feed's sections, newest first, on the school's calendar. */
    sectionToday: "Today",
    sectionYesterday: "Yesterday",
    sectionThisWeek: "Earlier this week",
    sectionThisMonth: "Earlier this month",
    sectionMonth: (month: string, year: number) => `${month} ${year}`,
    sectionUndated: "Date unknown",
    /** The time on the right of a row, by section. */
    weekdayAndTime: (weekday: string, time: string) => `${weekday} ${time}`,
    dateAndTime: (date: string, time: string) => `${date}, ${time}`,
    /** The day a screen reader hears, since it may skip the section header. */
    spokenToday: "today",
    spokenYesterday: "yesterday",
    endOfFeed: "That's all your notifications.",
    olderFailed: "Couldn't load older notifications.",
    /**
     * Another parent account linked one of this parent's children, in the
     * contract's words (docs/TALAAN-API.md, the feed). Without a name when
     * their account is gone.
     */
    guardianLinked: (guardianName: string, childName: string) =>
      `An account named ${guardianName} linked to ${childName}.`,
    guardianLinkedNoName: (childName: string) =>
      `A parent account linked to ${childName}.`,
    guardianLinkedAdvice: "If you don't know them, contact the school.",
    opensChildDay: (childName: string) => `Opens ${childName}'s day`,
    marksAsRead: "Marks it as read",
    unreadLabel: "Unread",
    loadingMore: "Loading more…",
  },

  childDay: {
    title: "Today",
    taps: "Taps today",
    noTaps: "No taps yet today.",
    notFound: "That's no longer available.",
    tappedIn: "Tapped in",
    tappedOut: "Tapped out",
    back: "Back",
  },
} as const;
