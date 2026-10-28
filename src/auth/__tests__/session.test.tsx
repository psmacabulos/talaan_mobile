/**
 * Signing out, and the bug that made it hang (docs/PROBLEMS-LOG.md, P-009).
 *
 * `hasToken` used to live in the query cache. `forgetSession` clears that
 * cache, which destroyed the very query the gate was watching — and the
 * `setQueryData` afterwards built a *different* query the orphaned observer
 * never saw. The gate was never told, so nobody was moved to sign-in and the
 * app sat on "Checking your sign-in…" for ever.
 *
 * These tests watch the thing the gate watches. If `hasToken` ever stops
 * reaching a listener after a sign-out, they fail.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { signOut as signOutRequest } from "@/api/endpoints";
import { clearToken } from "@/api/token";
import { Button } from "@/components/form/button";
import { stopPushOnThisPhone } from "@/push/notifications";
import { waitForRegistration } from "@/push/registration";

import { useSignOut } from "../session";
import { SessionProvider, useSession } from "../session-context";

jest.mock("@/api/endpoints", () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
  getMe: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  getSchools: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/push/notifications", () => ({
  stopPushOnThisPhone: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/push/registration", () => ({
  waitForRegistration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/api/token", () => ({
  getToken: jest.fn().mockResolvedValue("tal_par_abc"),
  setToken: jest.fn().mockResolvedValue(undefined),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

const signOutMock = signOutRequest as jest.MockedFunction<
  typeof signOutRequest
>;
const clearTokenMock = clearToken as jest.MockedFunction<typeof clearToken>;

/** Shows what the gate would see, and offers the button a parent presses. */
function Probe() {
  const { hasToken } = useSession();
  const signOut = useSignOut();

  return (
    <>
      <Text>{`hasToken:${String(hasToken)}`}</Text>
      <Button label="Sign out" onPress={() => signOut.mutate()} />
    </>
  );
}

function renderProbe() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Probe />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("signing out", () => {
  test("tells the gate, even though the cache was cleared", async () => {
    const user = userEvent.setup();
    await renderProbe();

    expect(await screen.findByText("hasToken:true")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("hasToken:false")).toBeTruthy();
  });

  test("clears the token from secure storage", async () => {
    const user = userEvent.setup();
    await renderProbe();
    await screen.findByText("hasToken:true");

    await user.press(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("hasToken:false");

    expect(clearTokenMock).toHaveBeenCalled();
  });

  test("signs out locally even when the server cannot be reached", async () => {
    signOutMock.mockRejectedValue(new Error("no internet"));

    const user = userEvent.setup();
    await renderProbe();
    await screen.findByText("hasToken:true");

    await user.press(screen.getByRole("button", { name: "Sign out" }));

    // The server's own copy expires after 30 days unused. What matters is
    // that this phone forgot, and that the parent is not shown an error.
    expect(await screen.findByText("hasToken:false")).toBeTruthy();
    expect(clearTokenMock).toHaveBeenCalled();
  });

  test("stops pushes on this phone even when the server cannot be reached", async () => {
    signOutMock.mockRejectedValue(new Error("no internet"));

    const user = userEvent.setup();
    await renderProbe();
    await screen.findByText("hasToken:true");

    await user.press(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("hasToken:false");

    // The server would keep this phone's push address for up to 30 days, and
    // a signed-out phone must not keep showing children's names.
    expect(stopPushOnThisPhone).toHaveBeenCalled();
    // A registration still running could make the channel again afterwards.
    expect(
      jest.mocked(waitForRegistration).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(stopPushOnThisPhone).mock.invocationCallOrder[0],
    );
  });
});

describe("starting up", () => {
  test("reports no token when secure storage is empty", async () => {
    const { getToken } = jest.requireMock("@/api/token");
    getToken.mockResolvedValueOnce(null);

    await renderProbe();

    expect(await screen.findByText("hasToken:false")).toBeTruthy();
  });
});
