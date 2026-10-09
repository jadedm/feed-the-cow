// Renders the SVGs in art/ to the PNGs the game loads, at their fixed sizes.
// Run `node art/build-art.mjs` first. With no arguments every image is
// rendered; name SVG files (`node art/render-art.mjs grass.svg title.svg`) to
// render only those. Every image is rendered and checked before any file is
// written, so a run that fails (font not loaded, wrong size) writes nothing.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ART = dirname(fileURLToPath(import.meta.url));
const IMAGES = join(ART, "..", "src", "images");

// Source, output, size and whether the background is transparent. Keep in
// step with the table in art/README.md.
const TARGETS = {
  "title.svg": { png: "title.png", width: 960, height: 540, transparent: false },
  "loading.svg": { png: "TitleImage.png", width: 425, height: 223, transparent: true },
  "loader-bar.svg": { png: "loader_bar.png", width: 291, height: 21, transparent: true },
  "cow-run.svg": { png: "cow-run.png", width: 1280, height: 100, transparent: true },
  "cow-hit.svg": { png: "cow-hit.png", width: 160, height: 100, transparent: true },
  "cow-icon.svg": { png: "cow-icon.png", width: 64, height: 64, transparent: true },
  "field.svg": { png: "field.png", width: 960, height: 540, transparent: false },
  "grass.svg": { png: "grass.png", width: 60, height: 30, transparent: true },
  "injection.svg": { png: "injection.png", width: 60, height: 13, transparent: true },
  "try-again.svg": { png: "try-again.png", width: 143, height: 48, transparent: true },
};

const names = process.argv.slice(2);
const unknown = names.filter((name) => !TARGETS[name]);
if (unknown.length) {
  console.error(`Unknown SVG: ${unknown.join(", ")}`);
  process.exit(1);
}

// The PNG's width and height, read from its IHDR chunk.
function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const rendered = [];
const problems = [];
for (const name of names.length ? names : Object.keys(TARGETS)) {
  const target = TARGETS[name];
  const svg = readFileSync(join(ART, name), "utf8");
  await page.setContent(`<!doctype html><html><head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Quicksand:400,700">
    <style>html, body { margin: 0; background: transparent; }
    svg { display: block; position: absolute; left: 0; top: 0; }</style>
    </head><body>${svg}</body></html>`);
  // document.fonts.check() is true when no Quicksand face exists at all, so
  // look for loaded faces of both weights instead.
  const fontLoaded = await page.evaluate(async () => {
    await Promise.all([document.fonts.load("700 20px Quicksand"), document.fonts.load("400 20px Quicksand")]);
    const loaded = [...document.fonts].filter(
      (face) => face.family.replace(/["']/g, "") === "Quicksand" && face.status === "loaded"
    );
    return ["400", "700"].every((weight) => loaded.some((face) => face.weight === weight));
  });
  if (!fontLoaded) {
    problems.push(`${name}: Quicksand 400 and 700 did not both load`);
    break;
  }
  const buffer = await page.locator("svg").screenshot({ omitBackground: target.transparent });
  const size = pngSize(buffer);
  const ok = size.width === target.width && size.height === target.height;
  if (!ok) problems.push(`${name}: rendered ${size.width}x${size.height}, want ${target.width}x${target.height}`);
  rendered.push({ name, target, buffer, size });
}
await browser.close();

if (problems.length) {
  console.error(`Nothing written.\n${problems.join("\n")}`);
  process.exit(1);
}
for (const { name, target, buffer, size } of rendered) {
  writeFileSync(join(IMAGES, target.png), buffer);
  console.log(`${name} -> src/images/${target.png} ${size.width}x${size.height}`);
}
