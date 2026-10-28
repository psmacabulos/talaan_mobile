/**
 * Sending the push address: in the order the server needs, never without
 * permission, quietly on failure, and once when two callers land together.
 */
import { registerPushToken } from "@/api/endpoints";

import {
  ensureAttendanceChannel,
  getPermission,
  getPushToken,
  pushPlatform,
} from "../notifications";
import { registerThisPhone, waitForRegistration } from "../registration";

jest.mock("@/api/endpoints", () => ({
  registerPushToken: jest.fn(),
}));

jest.mock("../notifications", () => ({
  ...jest.requireActual("../notifications"),
  ensureAttendanceChannel: jest.fn(),
  getPermission: jest.fn(),
  getPushToken: jest.fn(),
  pushPlatform: jest.fn(),
}));

const register = jest.mocked(registerPushToken);
const channel = jest.mocked(ensureAttendanceChannel);
const permission = jest.mocked(getPermission);
const token = jest.mocked(getPushToken);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(pushPlatform).mockReturnValue("android");
  channel.mockResolvedValue(undefined);
  permission.mockResolvedValue({ granted: true, canAsk: false });
  token.mockResolvedValue("ExponentPushToken[abc]");
  register.mockResolvedValue(undefined);
});

test("makes the channel before sending the address", async () => {
  const order: string[] = [];
  channel.mockImplementation(async () => {
    order.push("channel");
  });
  register.mockImplementation(async () => {
    order.push("register");
  });

  await registerThisPhone();

  expect(order).toEqual(["channel", "register"]);
  expect(register).toHaveBeenCalledWith({
    token: "ExponentPushToken[abc]",
    platform: "android",
  });
});

test.each([true, false])(
  "sends nothing without permission (can still ask: %p)",
  async (canAsk) => {
    permission.mockResolvedValue({ granted: false, canAsk });

    await registerThisPhone();

    expect(token).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  },
);

test("sends nothing when the phone has no address", async () => {
  token.mockResolvedValue(null);

  await registerThisPhone();

  expect(register).not.toHaveBeenCalled();
});

test("a failed send is quiet: the next return to the app tries again", async () => {
  register.mockRejectedValue(new Error("network"));

  await expect(registerThisPhone()).resolves.toBeUndefined();
});

test("two callers at once send the address once", async () => {
  await Promise.all([registerThisPhone(), registerThisPhone()]);

  expect(register).toHaveBeenCalledTimes(1);
});

test("a caller who arrives after permission was granted gets it sent", async () => {
  // The first run checked just before the parent tapped Allow.
  permission.mockResolvedValueOnce({ granted: false, canAsk: true });

  await Promise.all([registerThisPhone(), registerThisPhone()]);

  expect(register).toHaveBeenCalledTimes(1);
});

test("sign-out can wait for a run that's already going", async () => {
  let finishPost: () => void = () => {};
  register.mockReturnValue(
    new Promise<void>((resolve) => {
      finishPost = resolve;
    }),
  );
  const run = registerThisPhone();
  let waited = false;
  const waiting = waitForRegistration().then(() => {
    waited = true;
  });

  // Let the run reach the POST, which hasn't answered yet.
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(waited).toBe(false);

  finishPost();
  await Promise.all([run, waiting]);
  expect(waited).toBe(true);
});

test("there's nothing to wait for when no run is going", async () => {
  await expect(waitForRegistration()).resolves.toBeUndefined();
});
