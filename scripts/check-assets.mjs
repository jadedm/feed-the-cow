// Fails when the build output is missing a file the game requests at runtime.
//
// Phaser loads assets from string paths such as "src/images/BG.png", which
// Vite never sees, and index.html loads Phaser itself with plain script tags.
// A missing file still gets a 200 from `vite preview` and an HTML 404 page
// from nginx, so the browser never says which file is gone. This script reads
// every such path and checks it exists under dist/.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ASSET_LITERAL = /["'](src\/[^"']+\.(?:png|jpe?g|gif|mp3|wav|ogg|json))["']/g;
const HTML_REFERENCE = /(?:src|href)="(?:\.\/|\/)?([^"#?:]+)"/g;

function matchesIn(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

function pathsFromGameCode() {
  return readdirSync("src")
    .filter((name) => name.endsWith(".js"))
    .flatMap((name) => matchesIn(readFileSync(join("src", name), "utf8"), ASSET_LITERAL));
}

function pathsFromBuiltHtml() {
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  return matchesIn(html, HTML_REFERENCE);
}

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`No ${DIST}/index.html. Run \`npm run build\` first.`);
  process.exit(1);
}

const paths = [...new Set([...pathsFromGameCode(), ...pathsFromBuiltHtml()])].sort();
const missing = paths.filter((path) => !existsSync(join(DIST, path)));

if (missing.length > 0) {
  console.error(`Missing from ${DIST}/ (${missing.length} of ${paths.length}):`);
  missing.forEach((path) => console.error(`  ${path}`));
  process.exit(1);
}

console.log(`All ${paths.length} runtime paths present in ${DIST}/.`);
