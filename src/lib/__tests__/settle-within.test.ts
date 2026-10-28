/**
 * Waiting for work, but never for ever.
 */
import { settleWithin } from "../settle-within";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("resolves as soon as the work finishes", async () => {
  const settled = jest.fn();
  void settleWithin(Promise.resolve("done"), 3_000).then(settled);

  await jest.advanceTimersByTimeAsync(0);

  expect(settled).toHaveBeenCalled();
});

test("resolves when the work fails, without passing the error on", async () => {
  await expect(
    settleWithin(Promise.reject(new Error("offline")), 3_000),
  ).resolves.toBeUndefined();
});

test("gives up on work that never finishes", async () => {
  const settled = jest.fn();
  void settleWithin(new Promise(() => {}), 3_000).then(settled);

  await jest.advanceTimersByTimeAsync(2_999);
  expect(settled).not.toHaveBeenCalled();

  await jest.advanceTimersByTimeAsync(1);
  expect(settled).toHaveBeenCalled();
});
