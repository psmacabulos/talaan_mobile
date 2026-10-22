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
  meResponseSchema,
  schoolsResponseSchema,
  type AuthResult,
  type Parent,
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
export async function getMe(): Promise<Parent> {
  const { parent } = await request({
    path: "/api/v1/parents/me",
    schema: meResponseSchema,
  });

  return parent;
}
