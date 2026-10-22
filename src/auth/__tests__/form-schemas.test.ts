/**
 * The form rules, against docs/PRODUCT-RULES.md, "Form field rules".
 *
 * These matter more than they look: the server checks the same things, and if
 * the two ever disagreed a parent would be told their details are fine and
 * then rejected, or be stopped from typing something the server would have
 * accepted. The messages are asserted too, not just the pass/fail, because
 * they are the same words the server sends back.
 */
import { signInFormSchema, signUpFormSchema } from "../form-schemas";
import { strings } from "@/strings";

const validSignUp = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  mobile: "09171234567",
  email: "parent@example.com",
  password: "aValidPassword",
  confirmPassword: "aValidPassword",
};

/** The first message for a field, or undefined if that field was accepted. */
function messageFor(
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
): string | undefined {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signing up", () => {
  test("accepts a parent who filled it in properly", () => {
    expect(signUpFormSchema.safeParse(validSignUp).success).toBe(true);
  });

  test.each([
    ["firstName", "", strings.fields.firstNameRequired],
    ["firstName", "   ", strings.fields.firstNameRequired],
    ["lastName", "", strings.fields.lastNameRequired],
    ["email", "not-an-email", strings.fields.emailInvalid],
    ["password", "short", strings.fields.passwordTooShort],
    ["password", "x".repeat(129), strings.fields.passwordTooLong],
  ])("%s rejects %p with the server's own words", (field, value, expected) => {
    const result = signUpFormSchema.safeParse({
      ...validSignUp,
      [field]: value,
      // keep the confirmation matching so only the field under test fails
      ...(field === "password"
        ? { confirmPassword: value as string }
        : {}),
    });

    expect(messageFor(result, field)).toBe(expected);
  });

  describe("the mobile number", () => {
    test.each(["09171234567", "+639171234567"])("accepts %s", (mobile) => {
      expect(
        signUpFormSchema.safeParse({ ...validSignUp, mobile }).success,
      ).toBe(true);
    });

    test.each([
      ["0917123456", "ten digits"],
      ["091712345678", "twelve digits"],
      ["+6391712345678", "too long with the country code"],
      ["639171234567", "the country code without the plus"],
      ["08171234567", "not an 09 number"],
      ["0917 123 4567", "spaces"],
    ])("rejects %p (%s)", (mobile) => {
      const result = signUpFormSchema.safeParse({ ...validSignUp, mobile });

      expect(messageFor(result, "mobile")).toBe(strings.fields.mobileInvalid);
    });
  });

  describe("the second password", () => {
    test("must match", () => {
      const result = signUpFormSchema.safeParse({
        ...validSignUp,
        confirmPassword: "somethingElse",
      });

      expect(messageFor(result, "confirmPassword")).toBe(
        strings.fields.passwordsDoNotMatch,
      );
    });

    test("the complaint lands on the confirmation, not the password", () => {
      const result = signUpFormSchema.safeParse({
        ...validSignUp,
        confirmPassword: "somethingElse",
      });

      expect(messageFor(result, "password")).toBeUndefined();
    });
  });

  test("trims and lowercases the email, so it matches what the server stores", () => {
    const result = signUpFormSchema.safeParse({
      ...validSignUp,
      email: "  Parent@Example.COM  ",
    });

    expect(result.success && result.data.email).toBe("parent@example.com");
  });

  test("trims names, so a trailing space is not part of a parent's name", () => {
    const result = signUpFormSchema.safeParse({
      ...validSignUp,
      firstName: "  Juan  ",
    });

    expect(result.success && result.data.firstName).toBe("Juan");
  });
});

describe("signing in", () => {
  test("accepts an email and any non-empty password", () => {
    expect(
      signInFormSchema.safeParse({
        email: "parent@example.com",
        password: "x",
      }).success,
    ).toBe(true);
  });

  test("asks for a password when there is none", () => {
    const result = signInFormSchema.safeParse({
      email: "parent@example.com",
      password: "",
    });

    expect(messageFor(result, "password")).toBe(
      strings.fields.passwordRequired,
    );
  });

  test("does not judge a short password — only the server knows if it is wrong", () => {
    expect(
      signInFormSchema.safeParse({
        email: "parent@example.com",
        password: "short",
      }).success,
    ).toBe(true);
  });
});
