/**
 * The addresses the app calls, one typed function each.
 *
 * Each arrives with the step that needs it, so the app never carries code for
 * a screen that does not exist yet. M2 added the school list, M3 the four
 * addresses behind signing in. The rest arrive with M4 to M7.
 */
import { request, requestNoContent } from "./client";
import {
  authResponseSchema,
  linkChildResponseSchema,
  meResponseSchema,
  schoolsResponseSchema,
  type AuthResult,
  type ChildToday,
  type MeResult,
  type School,
} from "./schemas";

/** Every Bantay Aral school, for the picker when linking a child (M4). */
export async function getSchools(): Promise<School[]> {
  const { schools } = await request({
    path: "/api/v1/parents/schools",
    auth: false,
    schema: schoolsResponseSchema,
  });

  return schools;
}

/** What a new parent types on the sign-up form. */
export type SignUpInput = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  /** The phone's model, so a parent can recognise this device later. */
  deviceLabel?: string;
};

export type SignInInput = {
  email: string;
  password: string;
  deviceLabel?: string;
};

/**
 * Create the account. `409 conflict` means the email is taken, which the
 * sign-up screen turns into "Sign in instead" (docs/TALAAN-API.md).
 *
 * The token comes back here but is stored by src/auth, not by this function:
 * one place decides what being signed in means.
 */
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  return request({
    method: "POST",
    path: "/api/v1/parents/signup",
    body: input,
    auth: false,
    schema: authResponseSchema,
  });
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  return request({
    method: "POST",
    path: "/api/v1/parents/login",
    body: input,
    auth: false,
    schema: authResponseSchema,
  });
}

/** Revokes this phone's token on the server, and removes its push address. */
export async function signOut(): Promise<void> {
  await requestNoContent({ method: "POST", path: "/api/v1/parents/logout" });
}

/**
 * Who is signed in. Called on every app start and every return to the
 * foreground: any request keeps the 30-day token alive, and this is the
 * cheapest one (docs/PRODUCT-RULES.md:67).
 */
export async function getMe(): Promise<MeResult> {
  return request({
    path: "/api/v1/parents/me",
    schema: meResponseSchema,
  });
}

/** What a parent types to link a child (docs/PRODUCT-RULES.md). */
export type LinkChildInput = {
  schoolId: string;
  /** Exactly 12 digits. Sent once, never stored and never sent back. */
  lrn: string;
  lastName: string;
  /** `YYYY-MM-DD` on the school's calendar. Built from the picked local date. */
  birthDate: string;
};

/**
 * Link a child to this parent.
 *
 * `404 not_found` means nothing matched **all four** details at that school,
 * and the server will not say which was wrong — so neither does the app.
 * `409 conflict` means this parent already linked that child.
 *
 * Answers with the child when the shape is one the app knows, and `null`
 * otherwise. Either way the link was made.
 */
export async function linkChild(
  input: LinkChildInput,
): Promise<ChildToday | null> {
  return request({
    method: "POST",
    path: "/api/v1/parents/children",
    body: input,
    schema: linkChildResponseSchema,
  });
}
