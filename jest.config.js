/**
 * jest-expo knows how to load React Native and Expo's modules; plain Jest
 * does not. The preset is tied to the SDK, so it moves with it.
 *
 * No setup file is needed: React Native Testing Library has included its own
 * matchers (toBeOnTheScreen, toHaveStyle) in the main export since v12.4, and
 * the old "@testing-library/react-native/extend-expect" entry point is gone.
 */
module.exports = {
  preset: "jest-expo",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}"],
};
