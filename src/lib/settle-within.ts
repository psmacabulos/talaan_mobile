/**
 * Wait for `work` to finish or fail, but never longer than `ms`. Its outcome
 * is ignored either way.
 *
 * For work that matters but mustn't keep a parent waiting, like stopping push
 * during a sign-out with no signal (docs/PROBLEMS-LOG.md, P-016).
 */
export function settleWithin(
  work: Promise<unknown>,
  ms: number,
): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    work
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        resolve();
      });
  });
}
