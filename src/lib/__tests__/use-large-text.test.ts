/**
 * The one threshold for "the text is large": from 130% the side-by-side
 * layouts stack.
 */
import { isLargeText } from "../use-large-text";

test.each([
  [1, false],
  [1.15, false],
  [1.3, true],
  [2, true],
])("at a font scale of %s, large is %s", (fontScale, large) => {
  expect(isLargeText(fontScale)).toBe(large);
});
