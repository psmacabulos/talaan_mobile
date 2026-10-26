/**
 * The feed: the badge's cap, the paging cursor, and a row the app cannot read.
 */
import { getChildDay, getFeedPage } from "@/api/endpoints";
import { feedPageSchema } from "@/api/schemas";
import { strings } from "@/strings";

import { badgeValue } from "../badge";

jest.mock("@/api/client", () => ({
  request: jest.fn().mockResolvedValue({
    notifications: [],
    unreadCount: 0,
    nextBefore: null,
  }),
  requestNoContent: jest.fn().mockResolvedValue(undefined),
}));

const { request } = jest.requireMock("@/api/client");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("the number on the tab", () => {
  test("nothing is shown when there is nothing to read", () => {
    expect(badgeValue(0)).toBeUndefined();
  });

  test.each([1, 5, 9])("a small count is shown as itself (%i)", (count) => {
    expect(badgeValue(count)).toBe(count);
  });

  test("ten becomes '9+', because ten means 'ten or more'", () => {
    // The server stops counting at 10. Showing a flat "10" would tell a parent
    // with thirty unread notifications that there were ten.
    expect(badgeValue(10)).toBe(strings.feed.badgeOverflow);
  });

  test("anything above the cap is also '9+'", () => {
    expect(badgeValue(47)).toBe(strings.feed.badgeOverflow);
  });

  test("a negative count shows nothing rather than a minus sign", () => {
    expect(badgeValue(-1)).toBeUndefined();
  });
});

describe("asking for a page", () => {
  test("the first page asks for no cursor at all", async () => {
    await getFeedPage();

    const { path } = request.mock.calls[0][0];
    expect(path).toContain("limit=30");
    expect(path).not.toContain("before=");
  });

  test("a later page sends the server's own cursor back", async () => {
    await getFeedPage("MjAyNi0wNi0xOA==");

    const { path } = request.mock.calls[0][0];
    expect(path).toContain("before=MjAyNi0wNi0xOA%3D%3D");
  });

  test("a cursor is URL-encoded, since it is base64 and can hold '=' and '+'", async () => {
    // Sent raw, "a+b=" would arrive as "a b" and the server would answer 400.
    await getFeedPage("a+b/c=");

    const { path } = request.mock.calls[0][0];
    expect(path).not.toMatch(/before=a\+b\/c=/);
    expect(path).toContain("before=a%2Bb%2Fc%3D");
  });
});

describe("asking for a child's day", () => {
  test("today needs no date", async () => {
    await getChildDay("student-0001");

    expect(request.mock.calls[0][0].path).toBe(
      "/api/v1/parents/children/student-0001/taps",
    );
  });

  test("a past day carries the date", async () => {
    await getChildDay("student-0001", "2026-06-19");

    expect(request.mock.calls[0][0].path).toContain("?date=2026-06-19");
  });
});

describe("a notification the app cannot read", () => {
  const good = {
    id: "notification-1",
    childId: "student-0001",
    childName: "Juan Cruz",
    kind: "time_in",
    at: "2026-10-22T07:56:00.000+08:00",
    read: false,
  };

  test("is dropped, and the rest of the page still arrives", () => {
    const page = feedPageSchema.safeParse({
      notifications: [
        good,
        // A kind added to the server after this app shipped.
        { ...good, id: "notification-2", kind: "went_to_the_canteen" },
        { ...good, id: "notification-3" },
      ],
      unreadCount: 3,
      nextBefore: null,
    });

    expect(page.success).toBe(true);
    expect(page.data?.notifications.map((item) => item.id)).toEqual([
      "notification-1",
      "notification-3",
    ]);
  });

  test("the last page says so with a null cursor", () => {
    const page = feedPageSchema.safeParse({
      notifications: [],
      unreadCount: 0,
      nextBefore: null,
    });

    expect(page.success && page.data.nextBefore).toBeNull();
  });
});

describe("another parent linked a child", () => {
  // Talaan Step 55.2. It was once dropped as "a notification the app cannot
  // read" while the badge still counted it (docs/PROBLEMS-LOG.md, P-013).
  const notice = {
    id: "notification-9",
    childId: "student-0001",
    childName: "Juan Cruz",
    kind: "guardian_linked",
    at: "2026-10-22T18:12:00.000+08:00",
    read: false,
    guardian: { firstName: "Ana", lastName: "Santos" },
  };

  function parse(notifications: unknown[]) {
    return feedPageSchema.parse({
      notifications,
      unreadCount: notifications.length,
      nextBefore: null,
    }).notifications;
  }

  test("is read, with who linked", () => {
    expect(parse([notice])).toEqual([notice]);
  });

  test("is read when their account is gone", () => {
    const [item] = parse([{ ...notice, guardian: null }]);

    expect(item).toMatchObject({ kind: "guardian_linked", guardian: null });
  });

  test("is read with no guardian at all", () => {
    const { guardian: _, ...withoutGuardian } = notice;

    expect(parse([withoutGuardian])).toHaveLength(1);
  });

  test("a guardian it can't read keeps the notice, without a name", () => {
    const [item] = parse([{ ...notice, guardian: { firstName: 5 } }]);

    expect(item).toMatchObject({ kind: "guardian_linked", guardian: null });
  });

  test("sits in the same page as taps, which are unchanged", () => {
    const tap = {
      id: "notification-1",
      childId: "student-0001",
      childName: "Juan Cruz",
      kind: "time_out",
      at: "2026-10-22T16:05:00.000+08:00",
      read: true,
    };

    expect(parse([notice, tap])).toEqual([notice, tap]);
  });
});
