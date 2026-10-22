/**
 * One error type for everything that can go wrong talking to the server.
 *
 * The server answers every failure in one shape (docs/TALAAN-API.md,
 * "Errors"):
 *
 *   {"error":{"code":"invalid_input","message":"Check the highlighted fields.",
 *             "fields":{"email":"Enter a valid email address"}}}
 *
 * Its `message` is already plain, friendly English and is shown to the parent
 * exactly as it arrives (docs/PRODUCT-RULES.md). Everything else — no internet,
 * a server that never answers, an answer that doesn't match the contract —
 * gets our own wording from src/strings.ts.
 *
 * **Nothing personal is ever kept on an error.** No request body (on sign-in
 * that is the parent's password), no headers, no token, no response body.
 * Only the code, the server's own message, which fields failed, the status and
 * the path.
 */
import { strings } from "@/strings";

/** The codes the contract defines (docs/TALAAN-API.md:211-216). */
export const API_ERROR_CODES = [
  "invalid_input",
  "unauthorized",
  "wrong_credentials",
  "too_many_tries",
  "not_found",
  "conflict",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorKind =
  /** The server answered, in the contract's error shape. */
  | "server"
  /** No answer at all: no internet, the server is down, or it timed out. */
  | "network"
  /** An answer arrived but didn't match the contract. */
  | "response"
  /** The app itself isn't set up: no EXPO_PUBLIC_API_URL. */
  | "config";

function isKnownCode(code: string): code is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(code);
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Only ever set when `kind` is "server", and only for a code we know. */
  readonly code?: ApiErrorCode;
  /**
   * The code exactly as the server sent it, known or not. A code is not
   * personal data, and without it a new one could not even be named in
   * docs/PROBLEMS-LOG.md.
   */
  readonly rawCode?: string;
  readonly status?: number;
  /** One message per field that failed, for `invalid_input`. */
  readonly fields?: Record<string, string>;
  /** The path asked for, to make a report readable. Never the query or body. */
  readonly path?: string;

  constructor(init: {
    kind: ApiErrorKind;
    message: string;
    code?: ApiErrorCode;
    rawCode?: string;
    status?: number;
    fields?: Record<string, string>;
    path?: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.kind = init.kind;
    this.code = init.code;
    this.rawCode = init.rawCode;
    this.status = init.status;
    this.fields = init.fields;
    this.path = init.path;
  }

  /**
   * The server answered with the error shape. `body` has already been checked;
   * an unrecognised code still carries the server's message, so a code added
   * later never leaves a parent staring at a blank screen.
   */
  static fromServer(
    status: number,
    body: { code: string; message: string; fields?: Record<string, string> },
    path: string,
  ): ApiError {
    return new ApiError({
      kind: "server",
      message: body.message,
      code: isKnownCode(body.code) ? body.code : undefined,
      rawCode: body.code,
      status,
      fields: body.fields,
      path,
    });
  }

  /** No answer at all. The one case a parent is most likely to hit. */
  static network(path: string): ApiError {
    return new ApiError({
      kind: "network",
      message: strings.errors.noAnswer,
      path,
    });
  }

  /** An answer that isn't the contract: bad JSON, or a shape Zod rejected. */
  static badResponse(path: string, status?: number): ApiError {
    return new ApiError({
      kind: "response",
      message: strings.errors.unexpected,
      status,
      path,
    });
  }

  static config(): ApiError {
    return new ApiError({ kind: "config", message: strings.errors.unexpected });
  }
}

/**
 * Whether this error means the sign-in is gone.
 *
 * **Branch on the code, never on the status.** `wrong_credentials` is also a
 * 401 (docs/TALAAN-API.md:213), so signing out on status alone would throw a
 * parent out every time they mistyped their password.
 */
export function meansSignedOut(error: unknown): boolean {
  return error instanceof ApiError && error.code === "unauthorized";
}
