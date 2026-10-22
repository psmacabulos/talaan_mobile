/**
 * The one way the app talks to Talaan.
 *
 * Every call goes through here, so the rules live in one place: the address
 * comes from the environment, the token is attached when there is one, every
 * answer is checked with Zod, and every failure becomes an `ApiError`
 * (docs/PLAN.md, M2).
 *
 * Nothing that is sent is ever kept on an error — on sign-in the body holds
 * the parent's password.
 */
import type { z } from "zod";

import { ConfigError, getBaseUrl } from "./config";
import { ApiError } from "./errors";
import { errorBodySchema } from "./schemas";
import { signOutLocally } from "./session";
import { getToken } from "./token";

/**
 * React Native's `fetch` has no timeout of its own, so a server that accepts
 * a connection and then says nothing would hang forever. Fifteen seconds is
 * long enough for a slow mobile connection in Balanga and short enough that a
 * parent isn't left watching a spinner.
 */
const TIMEOUT_MS = 15_000;

type Method = "GET" | "POST";

type SendOptions = {
  method?: Method;
  /** The full path, including `/api/v1/...`. Photos sit outside `/parents`. */
  path: string;
  body?: unknown;
  /** Attach the sign-in token. False for `/schools`, which needs none. */
  auth?: boolean;
};

type Sent = {
  status: number;
  /** Undefined for `204`, which four addresses answer with. */
  json: unknown;
};

async function send({
  method = "GET",
  path,
  body,
  auth = true,
}: SendOptions): Promise<Sent> {
  let url: string;
  try {
    url = `${getBaseUrl()}${path}`;
  } catch (error) {
    if (error instanceof ConfigError) {
      if (__DEV__) {
        // No personal data here, and the owner needs to see it to fix .env.
        console.error(`[api] ${error.message}`);
      }
      throw ApiError.config();
    }
    throw error;
  }

  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // No internet, the server is down, or the timeout fired. A parent can't
    // tell these apart and doesn't need to.
    throw ApiError.network(path);
  } finally {
    clearTimeout(timeout);
  }

  // `204` has no body at all, and `response.json()` throws on an empty one.
  if (response.status === 204) {
    return { status: response.status, json: undefined };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    await signOutIfUnauthorized(response.status);
    throw ApiError.badResponse(path, response.status);
  }

  if (!response.ok) {
    const parsed = errorBodySchema.safeParse(json);

    if (!parsed.success) {
      await signOutIfUnauthorized(response.status);
      throw ApiError.badResponse(path, response.status);
    }

    const apiError = ApiError.fromServer(
      response.status,
      parsed.data.error,
      path,
    );

    // Only `unauthorized` means the sign-in is gone. `wrong_credentials` is
    // also a 401 (docs/TALAAN-API.md:213) and must not sign anyone out.
    if (apiError.code === "unauthorized") {
      await signOutLocally();
    }

    throw apiError;
  }

  return { status: response.status, json };
}

/**
 * The contract is absolute: "Any `401` means signed out"
 * (docs/TALAAN-API.md:38).
 *
 * Usually that arrives as `unauthorized` in the error shape, handled above.
 * But something in front of the server — a proxy, a CDN, a login page — can
 * answer 401 with HTML or with JSON that isn't the contract. Leaving the dead
 * token in place would strand the parent on "Something went wrong" with no
 * way back to sign-in, and every later request would fail the same way.
 */
async function signOutIfUnauthorized(status: number): Promise<void> {
  if (status === 401) {
    await signOutLocally();
  }
}

/** A call that answers with a body, checked against `schema`. */
export async function request<T>(
  options: SendOptions & { schema: z.ZodType<T> },
): Promise<T> {
  const { schema, ...rest } = options;
  const { json } = await send(rest);

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // The issues name the fields that didn't match, never their values.
    if (__DEV__) {
      console.error(
        `[api] ${rest.path} did not match the contract:`,
        parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
      );
    }
    throw ApiError.badResponse(rest.path);
  }

  return parsed.data;
}

/** A call that answers `204` with no body: logout, read, read-all, push-tokens. */
export async function requestNoContent(options: SendOptions): Promise<void> {
  await send(options);
}
