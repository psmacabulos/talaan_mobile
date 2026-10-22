/**
 * Carries an email from sign-up to sign-in when the account already exists.
 *
 * A `409` on sign-up means the email is taken, and the useful thing to offer
 * is "Sign in instead" with the address already filled in
 * (docs/TALAAN-API.md).
 *
 * It is held in memory rather than passed as a route parameter. An email
 * identifies a parent, and a route parameter becomes part of the navigation
 * state — which is the kind of place personal data ends up in a log or a
 * crash report without anyone deciding it should (CLAUDE.md, "Students are
 * minors").
 *
 * Reading it clears it, so it is used once and never lingers.
 */
let pending: string | undefined;

export function rememberEmailForSignIn(email: string): void {
  pending = email;
}

export function takeEmailForSignIn(): string | undefined {
  const email = pending;
  pending = undefined;
  return email;
}
