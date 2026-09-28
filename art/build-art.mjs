// Writes the SVG sources for the cow and field art into art/.
//
// Run `node art/build-art.mjs`, then render each SVG to the PNG of the same
// name in src/images/ (see art/README.md). Everything here is drawn in code,
// so this art is covered by the MIT license, unlike the woohoo artwork.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));

const INK = "#2b2b2b";
const HIDE = "#ffffff";
const HIDE_FAR = "#e4e4e4";
const PATCH = "#2f2f2f";
const PINK = "#f4a6b8";
const HORN = "#f1dfa8";

export const FRAME_W = 160;
export const FRAME_H = 100;
export const RUN_FRAMES = 6;

function leg(hipX, hipY, angleDeg, far) {
  const length = 26;
  const rad = (angleDeg * Math.PI) / 180;
  const footX = hipX + Math.sin(rad) * length;
  const footY = hipY + Math.cos(rad) * length;
  const fill = far ? HIDE_FAR : HIDE;
  return `
    <line x1="${hipX}" y1="${hipY}" x2="${footX.toFixed(1)}" y2="${footY.toFixed(1)}" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
    <line x1="${hipX}" y1="${hipY}" x2="${footX.toFixed(1)}" y2="${footY.toFixed(1)}" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${footX.toFixed(1)}" cy="${footY.toFixed(1)}" r="5.5" fill="${INK}"/>`;
}

function tail(swing) {
  const tipX = 16 - swing * 3;
  const tipY = 50 + swing * 6;
  return `
    <path d="M36 40 Q24 ${38 + swing * 4} ${tipX} ${tipY}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="${tipX}" cy="${tipY + 3}" rx="4" ry="6" fill="${INK}" transform="rotate(${20 + swing * 15} ${tipX} ${tipY + 3})"/>`;
}

function head(eyes) {
  return `
    <path d="M118 22 q-2 -9 4 -12" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M118 22 q-2 -9 4 -12" fill="none" stroke="${HORN}" stroke-width="3" stroke-linecap="round"/>
    <path d="M133 21 q3 -9 -2 -13" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M133 21 q3 -9 -2 -13" fill="none" stroke="${HORN}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="108" cy="27" rx="10" ry="5.5" fill="${HIDE}" stroke="${INK}" stroke-width="3" transform="rotate(-25 108 27)"/>
    <ellipse cx="108" cy="27" rx="5" ry="2.5" fill="${PINK}" transform="rotate(-25 108 27)"/>
    <ellipse cx="127" cy="35" rx="19" ry="17" fill="${HIDE}" stroke="${INK}" stroke-width="3"/>
    <path d="M118 22 q8 -4 12 3 q-6 6 -12 -3z" fill="${PATCH}"/>
    <ellipse cx="141" cy="45" rx="12" ry="9" fill="${PINK}" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="137" cy="44" rx="1.8" ry="2.6" fill="${INK}"/>
    <ellipse cx="145" cy="44" rx="1.8" ry="2.6" fill="${INK}"/>
    ${eyes}`;
}

const OPEN_EYE = `
    <circle cx="129" cy="31" r="4" fill="${INK}"/>
    <circle cx="130.4" cy="29.6" r="1.4" fill="${HIDE}"/>`;

const CROSSED_EYE = `
    <path d="M125 27 l8 8 M133 27 l-8 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

function body(id) {
  return `
    <ellipse cx="76" cy="48" rx="46" ry="24" fill="${HIDE}" stroke="${INK}" stroke-width="3"/>
    <clipPath id="${id}"><ellipse cx="76" cy="48" rx="44.5" ry="22.5"/></clipPath>
    <g clip-path="url(#${id})" fill="${PATCH}">
      <path d="M44 24 q14 -2 18 10 q-4 12 -18 8 q-10 -8 0 -18z"/>
      <path d="M78 52 q12 -6 20 4 q2 12 -12 14 q-12 -4 -8 -18z"/>
      <path d="M100 26 q10 2 12 12 q-8 4 -14 -2z"/>
    </g>
    <ellipse cx="80" cy="70" rx="9" ry="5" fill="${PINK}" stroke="${INK}" stroke-width="2.5"/>`;
}

function runFrame(index) {
  const phase = (index / RUN_FRAMES) * Math.PI * 2;
  const swing = 32;
  const bob = -3 * Math.abs(Math.sin(phase));
  const frontNear = swing * Math.sin(phase);
  const frontFar = swing * Math.sin(phase + 0.9);
  const backNear = swing * Math.sin(phase + Math.PI);
  const backFar = swing * Math.sin(phase + Math.PI + 0.9);
  return `
  <g transform="translate(${index * FRAME_W} ${bob.toFixed(1)})">
    ${leg(102, 62, frontFar, true)}
    ${leg(56, 62, backFar, true)}
    ${tail(Math.sin(phase))}
    ${body("hide" + index)}
    ${leg(94, 64, frontNear, false)}
    ${leg(48, 64, backNear, false)}
    ${head(OPEN_EYE)}
  </g>`;
}

function svg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}\n</svg>\n`;
}

function runSheet() {
  const frames = Array.from({ length: RUN_FRAMES }, (_, i) => runFrame(i)).join("");
  return svg(FRAME_W * RUN_FRAMES, FRAME_H, frames);
}

function hitCow() {
  return svg(
    FRAME_W,
    FRAME_H,
    `
  <g transform="rotate(-14 80 50)">
    ${leg(102, 62, 150, true)}
    ${leg(56, 62, -150, true)}
    ${tail(1)}
    ${body("hide-hit")}
    ${leg(94, 64, 130, false)}
    ${leg(48, 64, -130, false)}
    ${head(CROSSED_EYE)}
    <path d="M140 53 q3 8 -2 10" fill="${PINK}" stroke="${INK}" stroke-width="2"/>
  </g>
  <g fill="#ffd23f" stroke="${INK}" stroke-width="1.5">
    <path d="M112 6 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z"/>
    <path d="M140 2 l1.5 4 4 .5 -3 2.5 1 4 -3.5 -2 -3.5 2 1 -4 -3 -2.5 4 -.5z"/>
  </g>`
  );
}

function icon() {
  return svg(
    64,
    64,
    `
  <g transform="translate(-99 -4) scale(1)">
    ${head(OPEN_EYE)}
  </g>`
  );
}

// Deterministic pseudo-random numbers, so the field is the same every build.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Draws a decoration at x, and again one tile width away when it would cross
// an edge, so the background repeats with no visible seam.
function wrapped(x, width, tileWidth, draw) {
  const copies = [draw(x)];
  if (x - width < 0) copies.push(draw(x + tileWidth));
  if (x + width > tileWidth) copies.push(draw(x - tileWidth));
  return copies.join("");
}

function field() {
  const W = 960;
  const H = 540;
  const HORIZON = 96;
  const rand = seeded(24);

  const hills = (y, amp, period, color) => {
    let d = `M0 ${H} L0 ${y}`;
    for (let x = 0; x <= W; x += 8) {
      d += ` L${x} ${(y - amp * Math.sin((x / period) * Math.PI * 2)).toFixed(1)}`;
    }
    return `<path d="${d} L${W} ${H}z" fill="${color}"/>`;
  };

  const clouds = [120, 430, 760]
    .map((cx, i) =>
      wrapped(cx, 60, W, (x) => {
        const y = 28 + i * 9;
        return `<g fill="#ffffff" opacity="0.9"><ellipse cx="${x}" cy="${y}" rx="38" ry="13"/><ellipse cx="${x - 22}" cy="${y + 4}" rx="22" ry="10"/><ellipse cx="${x + 24}" cy="${y + 3}" rx="24" ry="10"/></g>`;
      })
    )
    .join("");

  const bands = [];
  for (let y = HORIZON + 30, i = 0; y < H; y += 44, i++) {
    bands.push(`<rect x="0" y="${y}" width="${W}" height="22" fill="${i % 2 ? "#86c860" : "#80c25a"}"/>`);
  }

  const tufts = [];
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rand() * W);
    const y = Math.round(HORIZON + 40 + rand() * (H - HORIZON - 50));
    tufts.push(
      wrapped(x, 12, W, (px) => `<path d="M${px - 8} ${y} q3 -12 5 -2 q2 -14 4 0 q3 -10 5 2" fill="none" stroke="#5e9e3c" stroke-width="2.2" stroke-linecap="round"/>`)
    );
  }

  const flowers = [];
  const petals = ["#ffffff", "#ffe066", "#ffb3c7"];
  for (let i = 0; i < 26; i++) {
    const x = Math.round(rand() * W);
    const y = Math.round(HORIZON + 50 + rand() * (H - HORIZON - 60));
    const petal = petals[i % petals.length];
    flowers.push(
      wrapped(x, 8, W, (px) => `<g><circle cx="${px - 3}" cy="${y}" r="2.6" fill="${petal}"/><circle cx="${px + 3}" cy="${y}" r="2.6" fill="${petal}"/><circle cx="${px}" cy="${y - 3}" r="2.6" fill="${petal}"/><circle cx="${px}" cy="${y + 3}" r="2.6" fill="${petal}"/><circle cx="${px}" cy="${y}" r="2" fill="#f2a900"/></g>`)
    );
  }

  return svg(
    W,
    H,
    `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8dcf5"/><stop offset="1" stop-color="#dff3fc"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${clouds}
  ${hills(HORIZON, 10, 480, "#a9d98a")}
  ${hills(HORIZON + 18, 8, 320, "#94cf6f")}
  <rect x="0" y="${HORIZON + 26}" width="${W}" height="${H - HORIZON - 26}" fill="#8ccc66"/>
  ${bands.join("")}
  ${tufts.join("")}
  ${flowers.join("")}`
  );
}

const files = {
  "cow-run.svg": runSheet(),
  "cow-hit.svg": hitCow(),
  "cow-icon.svg": icon(),
  "field.svg": field(),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
}

console.log(`Wrote ${Object.keys(files).length} SVG files to art/.`);
