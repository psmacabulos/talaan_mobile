/**
 * The status pill: the word always, and an icon beside it for the three
 * statuses that mean something happened (the owner's design). Colour never
 * carries the meaning alone (docs/DESIGN.md, rule 3), and neither does the
 * icon: it's hidden from screen readers.
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import { render, screen } from "@testing-library/react-native";

import type { StatusLabel } from "@/children/status-words";
import { strings } from "@/strings";

import { StatusPill } from "../status-pill";

test.each([
  ["present", strings.status.present],
  ["late", strings.status.late],
  ["absent", strings.status.absent],
] as const)("%s shows its word and an icon", async (tone, word) => {
  const label: StatusLabel = { word, tone };
  await render(<StatusPill label={label} />);

  expect(screen.getByText(word)).toBeOnTheScreen();
  expect(screen.getByTestId("status-pill-icon")).toBeOnTheScreen();
});

test("not yet tapped shows its word alone", async () => {
  await render(
    <StatusPill label={{ word: strings.status.idle, tone: "idle" }} />,
  );

  expect(screen.getByText(strings.status.idle)).toBeOnTheScreen();
  expect(screen.queryByTestId("status-pill-icon")).toBeNull();
});
