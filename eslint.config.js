/**
 * Expo's own ESLint config, plus the folders that aren't ours to lint.
 */
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "reference/*"],
  },
]);
