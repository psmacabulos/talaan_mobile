/**
 * The sign-in screen: its look, its field rules, and the three answers from
 * the server that need handling differently (docs/PLAN.md, M3).
 *
 * It lives here, not beside the screen: Expo Router turns EVERY file under
 * src/app into a route, test files included, which would ship the testing
 * library inside the app (docs/PROBLEMS-LOG.md, P-004).
 *
 * Everything that would reach the network is mocked. A test must never
 * depend on a connection — left real it waits, times out at five seconds, and
 * fails offline and in CI while saying nothing about the screen (P-008).
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { signIn } from "@/api/endpoints";
import SignInScreen from "@/app/(auth)/sign-in";
import { SessionProvider } from "@/auth/session-context";
import { strings } from "@/strings";

jest.mock("@/api/endpoints", () => ({
  signIn: jest.fn(),
  getSchools: jest.fn().mockResolvedValue([]),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// The session's sign-out stops push. Left real, it loads expo-notifications,
// which warns that push doesn't work in Expo Go.
jest.mock("@/push/notifications", () => ({
  stopPushOnThisPhone: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/push/registration", () => ({
  waitForRegistration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/api/token", () => ({
  getToken: jest.fn().mockResolvedValue(null),
  setToken: jest.fn().mockResolvedValue(undefined),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

const signInMock = signIn as jest.MockedFunction<typeof signIn>;

/** SafeAreaProvider has no real insets in a test, so they're supplied here. */
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  // Retries off: a test should assert the first answer, not the third.
  // gcTime 0: otherwise the cache keeps a five-minute timer per query alive
  // after the test ends, which Jest reports as a worker that would not exit.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SafeAreaProvider initialMetrics={metrics}>
          <SignInScreen />
        </SafeAreaProvider>
      </SessionProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("the look", () => {
  test("shows the heading and what the app is for", async () => {
    await renderScreen();

    expect(screen.getByText(strings.signIn.heading)).toBeTruthy();
    expect(screen.getByText(strings.signIn.subheading)).toBeTruthy();
  });

  test("the logo reads as one thing, not a picture plus text", async () => {
    await renderScreen();

    expect(screen.getByLabelText(strings.brand.logoLabel)).toBeTruthy();
  });

  test("both fields are reachable by their labels", async () => {
    await renderScreen();

    expect(screen.getByLabelText(strings.signIn.emailLabel)).toBeTruthy();
    expect(screen.getByLabelText(strings.signIn.passwordLabel)).toBeTruthy();
  });

  test("offers no way to recover a password, because there is none yet", async () => {
    await renderScreen();

    expect(screen.queryByText(/forgot/i)).toBeNull();
  });
});

describe("what the parent typed", () => {
  test("is checked before anything is sent", async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText(strings.signIn.emailLabel),
      "not-an-email",
    );
    await user.press(screen.getByRole("button", { name: strings.signIn.submit }));

    expect(await screen.findByText(strings.fields.emailInvalid)).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("what the server answered", () => {
  async function submitValid() {
    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText(strings.signIn.emailLabel),
      "parent@example.com",
    );
    await user.type(
      screen.getByLabelText(strings.signIn.passwordLabel),
      "aPassword",
    );
    await user.press(
      screen.getByRole("button", { name: strings.signIn.submit }),
    );
  }

  test("a wrong password is shown in the server's own words", async () => {
    signInMock.mockRejectedValue(
      new ApiError({
        kind: "server",
        code: "wrong_credentials",
        status: 401,
        message: "That email or password is not right.",
      }),
    );

    await submitValid();

    expect(
      await screen.findByText("That email or password is not right."),
    ).toBeTruthy();
  });

  test("a wrong password keeps the email, so only the password is retyped", async () => {
    signInMock.mockRejectedValue(
      new ApiError({
        kind: "server",
        code: "wrong_credentials",
        status: 401,
        message: "That email or password is not right.",
      }),
    );

    await submitValid();
    await screen.findByText("That email or password is not right.");

    expect(screen.getByLabelText(strings.signIn.emailLabel).props.value).toBe(
      "parent@example.com",
    );
  });

  test("too many tries leaves the form usable", async () => {
    signInMock.mockRejectedValue(
      new ApiError({
        kind: "server",
        code: "too_many_tries",
        status: 429,
        message: "Too many tries. Wait a few minutes.",
      }),
    );

    await submitValid();
    await screen.findByText("Too many tries. Wait a few minutes.");

    const button = screen.getByRole("button", { name: strings.signIn.submit });
    expect(button.props.accessibilityState?.disabled).toBeFalsy();
  });

  test("no internet is said plainly, not as a password problem", async () => {
    signInMock.mockRejectedValue(ApiError.network("/api/v1/parents/login"));

    await submitValid();

    expect(
      await screen.findByText(strings.errors.noAnswer),
    ).toBeTruthy();
  });
});

describe("a complaint about a field this form does not have", () => {
  test("is still shown, instead of failing silently", async () => {
    // `deviceLabel` is sent with every sign-in and is on no form. Writing its
    // message onto a field that isn't rendered would leave the parent with a
    // stopped spinner and no reason at all.
    signInMock.mockRejectedValue(
      new ApiError({
        kind: "server",
        code: "invalid_input",
        status: 400,
        message: "Check the highlighted fields.",
        fields: { deviceLabel: "Unknown device" },
      }),
    );

    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText(strings.signIn.emailLabel),
      "parent@example.com",
    );
    await user.type(
      screen.getByLabelText(strings.signIn.passwordLabel),
      "aPassword",
    );
    await user.press(
      screen.getByRole("button", { name: strings.signIn.submit }),
    );

    expect(
      await screen.findByText("Check the highlighted fields."),
    ).toBeTruthy();
  });

  test("a complaint about a real field lands under that field", async () => {
    signInMock.mockRejectedValue(
      new ApiError({
        kind: "server",
        code: "invalid_input",
        status: 400,
        message: "Check the highlighted fields.",
        fields: { email: "We don't know that address" },
      }),
    );

    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText(strings.signIn.emailLabel),
      "parent@example.com",
    );
    await user.type(
      screen.getByLabelText(strings.signIn.passwordLabel),
      "aPassword",
    );
    await user.press(
      screen.getByRole("button", { name: strings.signIn.submit }),
    );

    expect(
      await screen.findByText("We don't know that address"),
    ).toBeTruthy();
    // The field message is enough; the generic line would be noise.
    expect(screen.queryByText("Check the highlighted fields.")).toBeNull();
  });
});
