/**
 * "Allow notifications?" is asked once per app session, and only while
 * Android still lets the app ask.
 *
 * "Once per session" is module state, so each test loads a fresh copy of the
 * module, and of the mocks it calls, with `jest.isolateModules`.
 */
jest.mock("../notifications", () => ({
  askPermission: jest.fn(),
  ensureAttendanceChannel: jest.fn(),
  getPermission: jest.fn(),
}));
jest.mock("../registration", () => ({ registerThisPhone: jest.fn() }));

type Permission = { granted: boolean; canAsk: boolean };

const NEVER_ASKED = { granted: false, canAsk: true };

function load(permission: Permission) {
  let loaded:
    | {
        askForPushPermissionOnce: () => Promise<void>;
        notifications: Record<string, jest.Mock>;
        registerThisPhone: jest.Mock;
      }
    | undefined;

  jest.isolateModules(() => {
    loaded = {
      askForPushPermissionOnce:
        jest.requireActual<typeof import("../ask-permission")>(
          "../ask-permission",
        ).askForPushPermissionOnce,
      notifications:
        jest.requireMock<Record<string, jest.Mock>>("../notifications"),
      registerThisPhone:
        jest.requireMock<Record<string, jest.Mock>>("../registration")
          .registerThisPhone,
    };
  });

  if (loaded === undefined) {
    throw new Error("the module did not load");
  }

  loaded.notifications.ensureAttendanceChannel.mockResolvedValue(undefined);
  loaded.notifications.getPermission.mockResolvedValue(permission);
  loaded.notifications.askPermission.mockResolvedValue(true);
  loaded.registerThisPhone.mockResolvedValue(undefined);
  return loaded;
}

test("asks a parent Android reports as 'denied' but never asked (P-018)", async () => {
  const m = load({ granted: false, canAsk: true });

  await m.askForPushPermissionOnce();

  expect(m.notifications.askPermission).toHaveBeenCalledTimes(1);
});

test("makes the channel, asks, then sends the address", async () => {
  const m = load(NEVER_ASKED);

  await m.askForPushPermissionOnce();

  expect(m.notifications.ensureAttendanceChannel).toHaveBeenCalled();
  expect(m.notifications.askPermission).toHaveBeenCalledTimes(1);
  expect(m.registerThisPhone).toHaveBeenCalled();
});

test.each([
  ["allowed", { granted: true, canAsk: false }],
  ["refused twice", { granted: false, canAsk: false }],
])("doesn't ask once %s", async (_, permission) => {
  const m = load(permission);

  await m.askForPushPermissionOnce();

  expect(m.notifications.askPermission).not.toHaveBeenCalled();
});

test("asks at most once per session, even if the prompt was dismissed", async () => {
  const m = load(NEVER_ASKED);
  m.notifications.askPermission.mockResolvedValue(false);

  await m.askForPushPermissionOnce();
  await m.askForPushPermissionOnce();

  expect(m.notifications.askPermission).toHaveBeenCalledTimes(1);
});

test("a parent who says no isn't sent anything", async () => {
  const m = load(NEVER_ASKED);
  m.notifications.askPermission.mockResolvedValue(false);

  await m.askForPushPermissionOnce();

  expect(m.registerThisPhone).not.toHaveBeenCalled();
});

test("a failure is quiet", async () => {
  const m = load(NEVER_ASKED);
  m.notifications.askPermission.mockRejectedValue(new Error("no activity"));

  await expect(m.askForPushPermissionOnce()).resolves.toBeUndefined();
});
