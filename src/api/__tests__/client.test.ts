/**
 * The API client against a fake server.
 *
 * Every code in the contract's error table is covered (docs/TALAAN-API.md,
 * "Errors"), plus the cases that have no code at all: no answer, a body that
 * isn't JSON, and an answer that doesn't match the contract.
 *
 * These live outside src/app because Expo Router turns every file there into
 * a route (docs/PROBLEMS-LOG.md, P-004).
 */
import * as SecureStore from "expo-secure-store";

import { request, requestNoContent } from "../client";
import { resetBaseUrlForTests } from "../config";
import { resetTokenCacheForTests } from "../token";
import { getSchools } from "../endpoints";
import { ApiError, meansSignedOut } from "../errors";
import { schoolsResponseSchema } from "../schemas";
import { onSignedOut, resetSessionForTests } from "../session";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const BASE = "https://bantayaral.example";

/** An answer from the fake server. No body means an empty one, like a 204. */
function answer(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (body === undefined) {
        throw new SyntaxError("Unexpected end of JSON input");
      }
      return body;
    },
  } as unknown as Response;
}

/** The contract's one error shape. */
function serverError(
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return { error: { code, message, ...(fields ? { fields } : {}) } };
}

const fetchMock = jest.fn();

/**
 * The client logs to the console in development when an answer does not match
 * the contract, and two tests below deliberately trigger that. Silencing it
 * keeps a passing run clean — a red stack trace in green output trains people
 * to ignore red stack traces.
 */
let devLog: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  devLog = jest.spyOn(console, "error").mockImplementation(() => {});
  resetBaseUrlForTests();
  resetTokenCacheForTests();
  resetSessionForTests();
  process.env.EXPO_PUBLIC_API_URL = BASE;
  secureStore.getItemAsync.mockResolvedValue(null);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  devLog.mockRestore();
});

describe("a call that works", () => {
  test("returns the checked answer", async () => {
    fetchMock.mockResolvedValue(
      answer(200, { schools: [{ id: "school-balanga", name: "Balanga" }] }),
    );

    await expect(getSchools()).resolves.toEqual([
      { id: "school-balanga", name: "Balanga" },
    ]);
  });

  test("ignores a field the app does not know, so a new one cannot break it", async () => {
    fetchMock.mockResolvedValue(
      answer(200, {
        schools: [{ id: "s1", name: "Balanga", motto: "added later" }],
        addedLater: true,
      }),
    );

    await expect(getSchools()).resolves.toEqual([
      { id: "s1", name: "Balanga" },
    ]);
  });

  test("asks the address from EXPO_PUBLIC_API_URL, never a hard-coded one", async () => {
    fetchMock.mockResolvedValue(answer(200, { schools: [] }));

    await getSchools();

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/v1/parents/schools`,
      expect.anything(),
    );
  });
});

describe("the token", () => {
  test("is sent when there is one", async () => {
    secureStore.getItemAsync.mockResolvedValue("tal_par_abc");
    fetchMock.mockResolvedValue(answer(200, { schools: [] }));

    await request({
      path: "/api/v1/parents/me",
      schema: schoolsResponseSchema,
    }).catch(() => undefined);

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer tal_par_abc");
  });

  test("is not even read for an address that needs none", async () => {
    fetchMock.mockResolvedValue(answer(200, { schools: [] }));

    await getSchools();

    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
  });
});

describe("every error code in the contract", () => {
  const cases: [string, number, string][] = [
    ["invalid_input", 400, "Check the highlighted fields."],
    ["unauthorized", 401, "Sign in to continue."],
    ["wrong_credentials", 401, "That email or password is not right."],
    ["not_found", 404, "That is no longer available."],
    ["conflict", 409, "That email is taken."],
    ["too_many_tries", 429, "Too many tries. Wait a few minutes."],
  ];

  test.each(cases)(
    "%s is passed through with the server's own words",
    async (code: string, status: number, message: string) => {
      fetchMock.mockResolvedValue(answer(status, serverError(code, message)));

      const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.kind).toBe("server");
      expect(error.code).toBe(code);
      expect(error.status).toBe(status);
      expect(error.message).toBe(message);
    },
  );

  test("invalid_input carries a message per field", async () => {
    fetchMock.mockResolvedValue(
      answer(
        400,
        serverError("invalid_input", "Check the highlighted fields.", {
          email: "Enter a valid email address",
        }),
      ),
    );

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.fields).toEqual({ email: "Enter a valid email address" });
  });

  test("a code the app does not know still shows the server's message", async () => {
    fetchMock.mockResolvedValue(
      answer(418, serverError("something_new", "The server says no.")),
    );

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("server");
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("The server says no.");
  });
});

describe("being signed out", () => {
  test("unauthorized clears the token and tells the app", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    fetchMock.mockResolvedValue(
      answer(401, serverError("unauthorized", "Sign in to continue.")),
    );

    const error = await getSchools().catch((e: unknown) => e);

    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(meansSignedOut(error)).toBe(true);
  });

  test("wrong_credentials does NOT sign anyone out, though it is also a 401", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    fetchMock.mockResolvedValue(
      answer(
        401,
        serverError(
          "wrong_credentials",
          "That email or password is not right.",
        ),
      ),
    );

    const error = await getSchools().catch((e: unknown) => e);

    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(meansSignedOut(error)).toBe(false);
  });

  test("several requests failing together sign the parent out once", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    fetchMock.mockResolvedValue(
      answer(401, serverError("unauthorized", "Sign in to continue.")),
    );

    await Promise.all([
      getSchools().catch(() => undefined),
      getSchools().catch(() => undefined),
      getSchools().catch(() => undefined),
    ]);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("when there is no answer at all", () => {
  test("a failed connection is said plainly", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("network");
    expect(error.message).toMatch(/internet connection/i);
  });

  test("a timeout looks the same to a parent", async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error("Aborted"), { name: "AbortError" }),
    );

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("network");
  });
});

describe("an answer that is not the contract", () => {
  test("a body that is not JSON", async () => {
    fetchMock.mockResolvedValue(answer(200));

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("response");
  });

  test("a shape Zod rejects", async () => {
    fetchMock.mockResolvedValue(answer(200, { schools: [{ id: 7 }] }));

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("response");
  });

  test("a failure that does not use the error shape", async () => {
    fetchMock.mockResolvedValue(answer(500, { oops: true }));

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe("response");
    expect(error.status).toBe(500);
  });
});

describe("an address that answers 204", () => {
  test("no body is not treated as a broken answer", async () => {
    fetchMock.mockResolvedValue(answer(204));

    await expect(
      requestNoContent({ method: "POST", path: "/api/v1/parents/logout" }),
    ).resolves.toBeUndefined();
  });
});

describe("nothing private reaches an error", () => {
  test("the request body is never kept, so a password cannot leak", async () => {
    fetchMock.mockResolvedValue(
      answer(
        401,
        serverError(
          "wrong_credentials",
          "That email or password is not right.",
        ),
      ),
    );

    const error = (await request({
      method: "POST",
      path: "/api/v1/parents/login",
      body: { email: "parent@example.com", password: "Talaan123!" },
      auth: false,
      schema: schoolsResponseSchema,
    }).catch((e: unknown) => e)) as ApiError;

    const seen = JSON.stringify({
      ...error,
      message: error.message,
      path: error.path,
    });

    expect(seen).not.toContain("Talaan123!");
    expect(seen).not.toContain("parent@example.com");
  });
});

describe("a 401 that is not the contract's error shape", () => {
  test("still signs the parent out, so they are not stranded", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    // What a proxy or CDN in front of the server answers.
    fetchMock.mockResolvedValue(answer(401, { oops: true }));

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(error.kind).toBe("response");
  });

  test("a 401 with no readable body signs them out too", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    fetchMock.mockResolvedValue(answer(401));

    await getSchools().catch(() => undefined);

    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("a 500 that is not the error shape does NOT sign anyone out", async () => {
    const handler = jest.fn();
    onSignedOut(handler);
    fetchMock.mockResolvedValue(answer(500, { oops: true }));

    await getSchools().catch(() => undefined);

    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("when the app's signed-out handler throws", () => {
  test("the caller still sees the API error, not the handler's", async () => {
    onSignedOut(() => {
      throw new Error("navigation blew up");
    });
    fetchMock.mockResolvedValue(
      answer(401, serverError("unauthorized", "Sign in to continue.")),
    );

    const error = (await getSchools().catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("unauthorized");
    expect(error.message).toBe("Sign in to continue.");
  });
});
