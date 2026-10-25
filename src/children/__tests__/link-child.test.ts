/**
 * Linking a child: the form rules, the date that is actually sent, and the
 * children list surviving a child it cannot read.
 */
import { linkChild } from "@/api/endpoints";
import { meResponseSchema } from "@/api/schemas";
import { strings } from "@/strings";

import { linkChildFormSchema } from "../form-schema";

jest.mock("@/api/client", () => ({
  request: jest.fn().mockResolvedValue(null),
  requestNoContent: jest.fn().mockResolvedValue(undefined),
}));

const { request } = jest.requireMock("@/api/client");

const validForm = {
  schoolId: "school-balanga",
  lrn: "100000000002",
  lastName: "Pascual",
  birthDate: new Date(2014, 2, 3),
};

function messageFor(
  result: {
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  },
  field: string,
): string | undefined {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("the form", () => {
  test("accepts the demo student's details", () => {
    expect(linkChildFormSchema.safeParse(validForm).success).toBe(true);
  });

  test.each([
    ["10000000000", "eleven digits"],
    ["1000000000023", "thirteen digits"],
    ["10000000000x", "a letter"],
    ["1000 0000 0002", "spaces"],
    ["", "nothing"],
  ])("rejects the LRN %p (%s)", (lrn) => {
    const result = linkChildFormSchema.safeParse({ ...validForm, lrn });

    expect(messageFor(result, "lrn")).toBe(strings.fields.lrnInvalid);
  });

  test("asks for a school when none is chosen", () => {
    const result = linkChildFormSchema.safeParse({
      ...validForm,
      schoolId: "",
    });

    expect(messageFor(result, "schoolId")).toBe(strings.fields.schoolRequired);
  });

  test("asks for the child's last name", () => {
    const result = linkChildFormSchema.safeParse({
      ...validForm,
      lastName: "   ",
    });

    expect(messageFor(result, "lastName")).toBe(
      strings.fields.childLastNameRequired,
    );
  });

  test("asks for a birth date when none was picked", () => {
    const result = linkChildFormSchema.safeParse({
      ...validForm,
      birthDate: undefined,
    });

    expect(messageFor(result, "birthDate")).toBe(
      strings.fields.birthDateRequired,
    );
  });
});

describe("what is sent to the server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("the birth date is the day the parent picked", async () => {
    await linkChild({
      schoolId: "school-balanga",
      lrn: "100000000002",
      lastName: "Pascual",
      // Already a calendar string by this point; the conversion is tested in
      // src/lib/__tests__/calendar-date.test.ts.
      birthDate: "2014-03-03",
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: "/api/v1/parents/children",
        body: expect.objectContaining({ birthDate: "2014-03-03" }),
      }),
    );
  });
});

describe("the children list", () => {
  const goodChild = {
    id: "student-0001",
    firstName: "Jose",
    lastName: "Pascual",
    gradeLevel: 7,
    section: "Rizal",
    photo: null,
    school: {
      id: "school-balanga",
      name: "Balanga City National Science High School",
      notificationPreference: "time_in_and_time_out",
    },
    today: {
      date: "2026-10-22",
      status: "present",
      flexible: false,
      timeIn: "2026-10-22T07:56:00.000+08:00",
      timeOut: null,
      tapCount: 1,
    },
  };

  const parent = {
    id: "parent-1",
    firstName: "Roberto",
    lastName: "Salvador",
    email: "parent@example.com",
    mobile: "09170000001",
  };

  test("drops a child it cannot read instead of failing the whole answer", () => {
    // A signed-in app must not be taken down by one odd child: a status added
    // to the server later, a null where a string was promised.
    const result = meResponseSchema.safeParse({
      parent,
      children: [
        goodChild,
        { ...goodChild, id: "student-0002", today: { ...goodChild.today, status: "from_the_future" } },
        { ...goodChild, id: "student-0003" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.children.map((child) => child.id)).toEqual([
      "student-0001",
      "student-0003",
    ]);
  });

  test("a parent with no children yet reads as an empty list", () => {
    const result = meResponseSchema.safeParse({ parent, children: [] });

    expect(result.success && result.data.children).toEqual([]);
  });

  test("children missing altogether is still an empty list", () => {
    const result = meResponseSchema.safeParse({ parent });

    expect(result.success && result.data.children).toEqual([]);
  });
});

describe("how a child's class is written", () => {
  test("is 'Grade 7 – Rizal', with the real values in it", () => {
    expect(strings.child.gradeAndSection(7, "Rizal")).toBe("Grade 7 – Rizal");
  });

  test("uses an en dash, as docs/PRODUCT-RULES.md specifies", () => {
    expect(strings.child.gradeAndSection(12, "Mabini")).toContain(" – ");
    expect(strings.child.gradeAndSection(12, "Mabini")).not.toContain(" - ");
  });

  test("never loses its values — a template with no placeholders left", () => {
    // This caught a real bug: an edit stripped `${gradeLevel}` and `${section}`
    // out of the template and every child read "Grade  – ". It still
    // typechecked, and nothing else asserted the text.
    const written = strings.child.gradeAndSection(9, "Bonifacio");

    expect(written).toMatch(/9/);
    expect(written).toMatch(/Bonifacio/);
  });
});
