/**
 * Fails if a colour is written anywhere outside src/theme.
 *
 * docs/DESIGN.md, rule 1: "Every colour, font size, space and corner lives in
 * src/theme … Components use token names only: no hex, rgb() or named
 * colours in components or screens."
 *
 * Run by `npm run check:colors`, and as its own step in CI so a stray colour
 * can never reach a phone.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** src/theme is where colours are allowed to be written down. */
// app.config.ts is checked by app.config.test.ts instead: Expo loads it
// standalone, so it cannot import a token (docs/PROBLEMS-LOG.md, P-002).
const ALLOWED = ["src/theme"];
const ROOTS = ["src"];
const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

/** Colour names worth catching. "transparent" is a layout tool, not a colour. */
const NAMED =
  "white|black|red|green|blue|yellow|orange|purple|pink|brown|gray|grey|silver|gold|cyan|magenta";

const RULES = [
  { name: "a hex colour", pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "an rgb() or rgba() colour", pattern: /\brgba?\s*\(/ },
  { name: "a named colour", pattern: new RegExp(`["'](${NAMED})["']`, "i") },
];

function filesUnder(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((entry) => filesUnder(join(path, entry)));
}

const posix = (path) => relative(process.cwd(), path).split("\\").join("/");

const findings = [];

for (const root of ROOTS) {
  for (const file of filesUnder(root)) {
    const name = posix(file);
    if (!EXTENSIONS.some((ext) => name.endsWith(ext))) continue;
    if (ALLOWED.some((allowed) => name.startsWith(allowed))) continue;

    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        // A comment explaining a colour is fine; writing one is not.
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;

        for (const rule of RULES) {
          const hit = line.match(rule.pattern);
          if (hit) {
            findings.push(`${name}:${index + 1}  ${rule.name}: ${hit[0]}`);
          }
        }
      });
  }
}

if (findings.length > 0) {
  console.error(
    `Found ${findings.length} colour(s) written outside src/theme.\n` +
      `Use a token from src/theme instead (docs/DESIGN.md, rule 1).\n`,
  );
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log("No colours outside src/theme.");
