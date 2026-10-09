// Takes the README screenshots from the built game: the title screen, a run
// in progress and the game-over screen, each 960x540, into screenshots/.
//
// Run `npm run build` first, then `node scripts/take-screenshots.mjs`. It
// serves dist/ with `vite preview` on its own port, drives the game in
// Playwright's Chromium with the sound muted, and stops the server when done.
// Items spawn at random, so the run screenshot differs a little each time.
// Exits non-zero, writing nothing, if any step fails or a shot is the wrong
// size.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "screenshots");
const PORT = 4199;
const URL = `http://localhost:${PORT}/`;

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: ROOT,
  stdio: "ignore",
});

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    const ok = await fetch(URL).then((r) => r.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`vite preview did not answer on ${URL} within 10 s`);
}

// PNG width and height from the IHDR chunk.
const pngSize = (buffer) => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });

async function shoot(page) {
  const buffer = await page.locator("canvas").screenshot();
  const size = pngSize(buffer);
  if (size.width !== 960 || size.height !== 540) {
    throw new Error(`canvas screenshot is ${size.width}x${size.height}, want 960x540`);
  }
  return buffer;
}

async function take() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
    // The game keeps its Phaser.Game in a local variable; catch it at boot.
    await page.addInitScript(() => {
      const hook = setInterval(() => {
        if (!window.Phaser || !window.Phaser.Game) return;
        const boot = window.Phaser.Game.prototype.boot;
        window.Phaser.Game.prototype.boot = function () {
          window.__game = this;
          const result = boot.apply(this, arguments);
          this.sound.mute = true;
          return result;
        };
        clearInterval(hook);
      }, 1);
    });
    await page.goto(URL);
    await page.waitForFunction(() => window.__game && window.__game.state.current === "StartMenu", null, {
      timeout: 20_000,
    });
    await page.evaluate(() => document.fonts.ready);
    // The scale manager centres the canvas a little after boot.
    await page.waitForTimeout(1000);
    const title = await shoot(page);

    await page.evaluate(() => window.__game.state.start("Game"));
    await page.waitForFunction(() => {
      const state = window.__game.state.getCurrentState();
      return window.__game.state.current === "Game" && state.cow && state.cow.alive;
    });
    // A few seconds of play with the cow safe, mid-field, after some grass.
    await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      state.__injectCow = state.injectCow;
      state.injectCow = () => {};
      state.cow.x = 220;
      state.cow.y = 230;
    });
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const state = window.__game.state.getCurrentState();
        const grass = state.grassGroup.getFirstAlive();
        if (grass) grass.reset(state.cow.x + 80, state.cow.y + 30);
      });
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(3500);
    const run = await shoot(page);

    await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      state.injectCow = state.__injectCow;
      state.injectionGroup.getFirstAlive().reset(state.cow.x + 80, state.cow.y + 30);
    });
    await page.waitForFunction(() => window.__game.state.getCurrentState().gameOver === true);
    await page.waitForTimeout(800);
    const over = await shoot(page);
    return { title, run, over };
  } finally {
    await browser.close();
  }
}

let code = 0;
try {
  await waitForServer();
  const shots = await take();
  writeFileSync(join(OUT, "title.png"), shots.title);
  writeFileSync(join(OUT, "gameplay.png"), shots.run);
  writeFileSync(join(OUT, "game-over.png"), shots.over);
  console.log("Wrote screenshots/title.png, gameplay.png and game-over.png, 960x540 each.");
} catch (error) {
  console.error(`Nothing written. ${error.message}`);
  code = 1;
} finally {
  server.kill();
}
process.exit(code);
