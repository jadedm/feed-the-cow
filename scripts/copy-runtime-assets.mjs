// Copies the files the game loads at runtime into dist/.
//
// Phaser loads images and audio from string paths such as "src/images/BG.png",
// and index.html loads Phaser and the gamepad plugin with plain script tags.
// Vite sees none of these, so `vite build` leaves them out. The game's own
// modules and stylesheet are bundled by Vite and are not copied again.
import { cpSync } from "node:fs";
import { join } from "node:path";

const RUNTIME_PATHS = [
  "src/images",
  "src/libs/phaser.js",
  "src/libs/plugins",
];

for (const path of RUNTIME_PATHS) {
  cpSync(path, join("dist", path), { recursive: true });
}

console.log(`Copied ${RUNTIME_PATHS.length} runtime paths into dist/.`);
