// Writes the SVG sources for the cow and field art into art/.
//
// Run `node art/build-art.mjs`, then render each SVG to the PNG of the same
// name in src/images/ (see art/README.md). Everything here is drawn in code,
// so this art is covered by the MIT license with the rest of the code.
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
export const RUN_FRAMES = 8;

const UPPER_LEG = 14;
const LOWER_LEG = 16;

// A leg in two segments. `thigh` is the upper segment's angle from straight
// down, positive toward the front (right). `bend` folds the lower segment back
// from the line of the upper one, as a knee or hock does when the leg lifts.
function leg(hipX, hipY, thigh, bend, far) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const kneeX = hipX + Math.sin(toRad(thigh)) * UPPER_LEG;
  const kneeY = hipY + Math.cos(toRad(thigh)) * UPPER_LEG;
  const shin = thigh - bend;
  const footX = kneeX + Math.sin(toRad(shin)) * LOWER_LEG;
  const footY = kneeY + Math.cos(toRad(shin)) * LOWER_LEG;
  const points = [hipX, hipY, kneeX, kneeY, footX, footY].map((n) => n.toFixed(1)).join(" ");
  const fill = far ? HIDE_FAR : HIDE;
  return `
    <polyline points="${points}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${points}" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${footX.toFixed(1)}" cy="${footY.toFixed(1)}" r="5" fill="${INK}"/>`;
}

// Gallop keyframes after Eadweard Muybridge, "The Horse in Motion" (1878,
// public domain). One [thigh, bend] pair per frame for the leading leg of
// each pair; the trailing leg of the pair runs one frame behind it.
// Frames 0 to 2: hind pair lands and pushes. 3 to 5: front pair lands and
// pushes. 6 and 7: all four legs gathered under the body, in the air.
const HIND_GAIT = [
  [24, 8], [4, 4], [-20, 4], [-36, 18], [-22, 60], [2, 72], [22, 52], [30, 24],
];
const FRONT_GAIT = [
  [4, 72], [24, 44], [34, 10], [20, 0], [0, 0], [-20, 4], [-34, 26], [-12, 70],
];
// Body lift (negative is up) and nose-up tilt in degrees, per frame.
const BODY_BOB = [1, 1, 0, -1, 1, 1, -3, -4];
const BODY_TILT = [2, 0, -3, -4, 1, 3, 1, 0];

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
  const trailing = (index + RUN_FRAMES - 1) % RUN_FRAMES;
  const [hindThigh, hindBend] = HIND_GAIT[index];
  const [hindFarThigh, hindFarBend] = HIND_GAIT[trailing];
  const [frontThigh, frontBend] = FRONT_GAIT[index];
  const [frontFarThigh, frontFarBend] = FRONT_GAIT[trailing];
  const tailSwing = Math.sin((index / RUN_FRAMES) * Math.PI * 2);
  return `
  <g transform="translate(${index * FRAME_W} ${BODY_BOB[index]}) rotate(${-BODY_TILT[index]} 76 48)">
    ${leg(102, 62, frontFarThigh, frontFarBend, true)}
    ${leg(56, 62, hindFarThigh, hindFarBend, true)}
    ${tail(tailSwing)}
    ${body("hide" + index)}
    ${leg(94, 62, frontThigh, frontBend, false)}
    ${leg(48, 62, hindThigh, hindBend, false)}
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
    ${leg(102, 62, 150, 20, true)}
    ${leg(56, 62, -150, -20, true)}
    ${tail(1)}
    ${body("hide-hit")}
    ${leg(94, 62, 130, 20, false)}
    ${leg(48, 62, -130, -20, false)}
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
  <g transform="translate(-94 -4)">
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

function fieldContent() {
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

  return `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8dcf5"/><stop offset="1" stop-color="#dff3fc"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${clouds}
  ${hills(HORIZON, 10, 480, "#a9d98a")}
  ${hills(HORIZON + 18, 8, 320, "#94cf6f")}
  <rect x="0" y="${HORIZON + 26}" width="${W}" height="${H - HORIZON - 26}" fill="#8ccc66"/>
  ${bands.join("")}
  ${tufts.join("")}
  ${flowers.join("")}`;
}

function field() {
  return svg(960, 540, fieldContent());
}

// Lettering uses Quicksand, the font the game already loads (SIL Open Font
// License). Render with the font available, see art/README.md.
const FONT = "Quicksand, sans-serif";
const NAVY = "#1d2b3a";
const BLADE = "#4f9a2f";
const BLADE_LIGHT = "#79c247";

// "feed the cow" in white with a dark outline, centred on x.
function lettering(x, y, size) {
  const small = Math.round(size * 0.55);
  const text = (fill, stroke, width) => `
    <text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" font-weight="700" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" paint-order="stroke">
      <tspan font-size="${size}">feed </tspan><tspan font-size="${small}" dy="-${Math.round(size * 0.12)}">THE</tspan><tspan font-size="${size}" dy="${Math.round(size * 0.12)}"> cow</tspan>
    </text>`;
  return text(HIDE, INK, Math.round(size * 0.16)) + text(HIDE, "none", 0);
}

// The first run frame of the cow, placed with its top-left at x, y.
function cowAt(x, y, scale, id) {
  const frame = runFrame(0).replace(/hide0/g, id);
  return `<g transform="translate(${x} ${y}) scale(${scale})">${frame}</g>`;
}

// A clump of fresh grass with two motion lines behind it, in a 60x30 box.
// Bright lime with a dark outline, so it stands out against the field.
function grassTuft(x, y) {
  const outline = "M3 28 L5 14 L9 21 L11 6 L16 18 L19 1 L23 16 L27 4 L30 17 L34 7 L36 19 L41 11 L42 28 Z";
  return `<g transform="translate(${x} ${y})">
    <g stroke="${HIDE}" stroke-width="2.5" stroke-linecap="round">
      <line x1="46" y1="12" x2="57" y2="12"/><line x1="48" y1="20" x2="57" y2="20"/>
    </g>
    <path d="${outline}" fill="#b5e33f" stroke="#2f6b1a" stroke-width="2" stroke-linejoin="round"/>
    <g stroke="#6aa62a" stroke-width="1.5" stroke-linecap="round">
      <line x1="12" y1="27" x2="13" y2="14"/><line x1="20" y1="27" x2="20" y2="10"/>
      <line x1="28" y1="27" x2="28" y2="12"/><line x1="35" y1="27" x2="36" y2="16"/>
    </g>
  </g>`;
}

function grass() {
  return svg(60, 30, grassTuft(0, 0));
}

// A syringe pointing left, the way injections fly at the cow, in 60x13.
function injection() {
  return svg(
    60,
    13,
    `
  <line x1="1" y1="6.5" x2="15" y2="6.5" stroke="#8a96a3" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="14" y="4" width="4" height="5" fill="#8a96a3"/>
  <rect x="18" y="2" width="27" height="9" rx="1.5" fill="#eef6fb" stroke="${INK}" stroke-width="1.4"/>
  <rect x="19.5" y="3.5" width="15" height="6" fill="#e5484d"/>
  <g stroke="${INK}" stroke-width="1"><line x1="24" y1="2" x2="24" y2="5"/><line x1="30" y1="2" x2="30" y2="5"/><line x1="36" y1="2" x2="36" y2="5"/></g>
  <rect x="45" y="5" width="9" height="3" fill="${INK}"/>
  <rect x="54" y="1" width="3" height="11" rx="1" fill="${INK}"/>`
  );
}

function button(width, height, label, size) {
  return `
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${Math.round(height * 0.18)}" fill="${NAVY}"/>
  <text x="${width / 2}" y="${height / 2 + size * 0.36}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${size}" fill="${HIDE}">${label}</text>`;
}

function tryAgain() {
  return svg(143, 48, button(143, 48, "try again", 22));
}

function loaderBar() {
  return svg(
    291,
    21,
    `
  <rect x="1" y="1" width="289" height="19" rx="9.5" fill="${BLADE}" stroke="${INK}" stroke-width="2"/>
  <rect x="6" y="5" width="279" height="4" rx="2" fill="${BLADE_LIGHT}"/>`
  );
}

// The loading screen: lettering above the cow, on a transparent background.
function loadingImage() {
  return svg(
    425,
    223,
    `
  ${lettering(212, 62, 62)}
  <ellipse cx="212" cy="210" rx="78" ry="9" fill="#c9b237" opacity="0.7"/>
  ${cowAt(132, 92, 1.0, "hide-load")}`
  );
}

function instruction(number, x, y, text) {
  return `
  <circle cx="${x}" cy="${y - 8}" r="15" fill="${NAVY}"/>
  <text x="${x}" y="${y - 1}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="${HIDE}">${number}</text>
  <text x="${x + 28}" y="${y}" font-family="${FONT}" font-size="24" fill="${INK}">${text}</text>`;
}

function titleScreen() {
  return svg(
    960,
    540,
    `
  ${fieldContent()}
  <rect x="150" y="345" width="660" height="150" rx="18" fill="${HIDE}" opacity="0.85"/>
  ${lettering(480, 105, 96)}
  ${cowAt(150, 175, 1.25, "hide-title")}
  <g transform="translate(400 222)">${button(160, 60, "let’s play", 28)}</g>
  <g transform="translate(610 228) scale(1.6)">${grassTuft(0, 0)}</g>
  ${instruction(1, 190, 388, "steer with the arrows, WASD, the joystick or a drag")}
  ${instruction(2, 190, 430, "eat the fresh grass and dodge the injections!")}
  <g transform="translate(330 456)">
    <rect x="0" y="4" width="16" height="26" rx="3" fill="none" stroke="${INK}" stroke-width="2"/>
    <rect x="22" y="12" width="26" height="16" rx="3" fill="none" stroke="${INK}" stroke-width="2"/>
    <path d="M14 0 q10 0 12 8" fill="none" stroke="${INK}" stroke-width="1.6"/>
    <text x="60" y="25" font-family="${FONT}" font-size="20" fill="${INK}">turn your phone sideways to play</text>
  </g>`
  );
}

const files = {
  "cow-run.svg": runSheet(),
  "cow-hit.svg": hitCow(),
  "cow-icon.svg": icon(),
  "field.svg": field(),
  "title.svg": titleScreen(),
  "loading.svg": loadingImage(),
  "loader-bar.svg": loaderBar(),
  "try-again.svg": tryAgain(),
  "grass.svg": grass(),
  "injection.svg": injection(),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
}

console.log(`Wrote ${Object.keys(files).length} SVG files to art/.`);
