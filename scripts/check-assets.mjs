// Fails when the build output is missing a file the game requests at runtime.
//
// Phaser loads assets from string paths such as "src/images/BG.png", which
// Vite never sees, and index.html loads Phaser itself with plain script tags.
// `vite preview` answers a missing file with index.html and a 200, so a broken
// build can look fine locally. This script reads every such path and checks
// it exists as a file under dist/.
//
// What it reads:
// - quoted or backtick "src/..." asset paths in main.js and every .js file
//   under src/ (Phaser's own library files excepted) and in dist/index.html
// - local src and href attributes in dist/index.html
// - local url() references in the built stylesheets under dist/assets/
//
// What it cannot see: paths built at runtime, such as "src/images/" + name.
// Write asset paths as whole string literals so this check covers them.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const DIST = "dist";
const SKIPPED_SOURCES = new Set(["src/libs/phaser.js", "src/libs/phaser.min.js"]);
const ASSET_EXTENSIONS = "png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|aac|json|xml|fnt|atlas|js|css";

const ASSET_LITERAL = new RegExp(`["'\`](src/[^"'\`$]+\\.(?:${ASSET_EXTENSIONS}))["'\`]`, "g");
const HTML_REFERENCE = /(?:src|href)=["'](?![a-z]+:|\/\/|#)(?:\.\/|\/)?([^"'#?]+)[^"']*["']/g;
const CSS_URL = /url\(\s*["']?(?!data:|https?:|\/\/)([^"')#?]+)/g;

function matchesIn(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

function filesUnder(dir, extension) {
  return readdirSync(dir, { recursive: true })
    .map((name) => join(dir, name))
    .filter((path) => path.endsWith(extension) && statSync(path).isFile());
}

function pathsFromGameCode() {
  const sources = ["main.js", ...filesUnder("src", ".js")].filter(
    (path) => !SKIPPED_SOURCES.has(path.split(sep).join("/")),
  );
  return sources.flatMap((path) => matchesIn(readFileSync(path, "utf8"), ASSET_LITERAL));
}

function pathsFromBuiltHtml() {
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  return [...matchesIn(html, HTML_REFERENCE), ...matchesIn(html, ASSET_LITERAL)];
}

function pathsFromBuiltCss() {
  const assetsDir = join(DIST, "assets");
  if (!existsSync(assetsDir)) return [];
  return filesUnder(assetsDir, ".css").flatMap((cssFile) =>
    matchesIn(readFileSync(cssFile, "utf8"), CSS_URL).map((url) =>
      relative(DIST, join(dirname(cssFile), url)),
    ),
  );
}

function isFileInDist(path) {
  const full = join(DIST, path);
  return existsSync(full) && statSync(full).isFile();
}

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`No ${DIST}/index.html. Run \`npm run build\` first.`);
  process.exit(1);
}

const paths = [
  ...new Set([...pathsFromGameCode(), ...pathsFromBuiltHtml(), ...pathsFromBuiltCss()]),
].sort();
const missing = paths.filter((path) => !isFileInDist(path));

if (missing.length > 0) {
  console.error(`Missing from ${DIST}/ (${missing.length} of ${paths.length}):`);
  missing.forEach((path) => console.error(`  ${path}`));
  process.exit(1);
}

console.log(`All ${paths.length} runtime paths present in ${DIST}/.`);
