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
  childDaySchema,
  feedPageSchema,
  linkChildResponseSchema,
  meResponseSchema,
  schoolsResponseSchema,
  type AuthResult,
  type ChildDay,
  type ChildToday,
  type FeedPage,
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

/**
 * This phone's push address (M7). One per sign-in: a new address replaces the
 * old, so sending it again on every app start is safe and is what keeps it
 * current after a reinstall (docs/TALAAN-API.md:221).
 */
export async function registerPushToken(input: {
  token: string;
  platform: "android" | "ios";
}): Promise<void> {
  await requestNoContent({
    method: "POST",
    path: "/api/v1/parents/push-tokens",
    body: input,
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

/** The feed's page size. The server clamps anything outside 1–50. */
const FEED_PAGE_SIZE = 30;

/**
 * One page of the feed, newest first, across every linked child.
 *
 * **`before` is the server's own cursor** and is sent back exactly as it
 * arrived. The app never builds or reads one: a cursor the server didn't make
 * is a `400`, not a quiet first page (docs/TALAAN-API.md). It is
 * URL-encoded because it is base64 and can contain characters a query string
 * would otherwise swallow.
 */
export async function getFeedPage(before?: string): Promise<FeedPage> {
  const query = new URLSearchParams({ limit: String(FEED_PAGE_SIZE) });

  if (before !== undefined) {
    query.set("before", before);
  }

  return request({
    path: `/api/v1/parents/notifications?${query.toString()}`,
    schema: feedPageSchema,
  });
}

/**
 * Just the unread count, as cheaply as the contract allows.
 *
 * The badge needs this wherever the parent is, so it cannot come from the
 * feed's own query — sharing that key would keep every page the parent has
 * scrolled through alive and refetching.
 */
export async function getUnreadCount(): Promise<number> {
  const { unreadCount } = await request({
    path: "/api/v1/parents/notifications?limit=1",
    schema: feedPageSchema,
  });

  return unreadCount;
}

/** Mark one notification read. Already-read is also a `204`. */
export async function markNotificationRead(id: string): Promise<void> {
  await requestNoContent({
    method: "POST",
    path: `/api/v1/parents/notifications/${encodeURIComponent(id)}/read`,
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await requestNoContent({
    method: "POST",
    path: "/api/v1/parents/notifications/read-all",
  });
}

/**
 * Every tap a child made on a day — they can leave and come back.
 *
 * Today when no date is given. A child who isn't this parent's answers `404`,
 * exactly as one that doesn't exist: the server never says "forbidden",
 * because that would confirm the child is real.
 */
export async function getChildDay(
  childId: string,
  date?: string,
): Promise<ChildDay> {
  const query = date === undefined ? "" : `?date=${encodeURIComponent(date)}`;

  return request({
    path: `/api/v1/parents/children/${encodeURIComponent(childId)}/taps${query}`,
    schema: childDaySchema,
  });
}
