// Takes the README screenshots from the built game: the title screen, a run
// in progress and the game-over screen, each 960x540, into screenshots/.
//
// Run `npm run build` first, then `node scripts/take-screenshots.mjs`. It
// serves dist/ with `vite preview` on its own port, drives the game in
// Playwright's Chromium with the sound muted, and stops the server when done.
// Items spawn at random, so the run screenshot differs a little each time.
// Exits non-zero, writing nothing, if port 4199 is already taken, the server
// stops early, any step fails or a shot is the wrong size.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "screenshots");
const PORT = 4199;
const URL = `http://localhost:${PORT}/`;

// Another server on the port would be screenshotted instead of this build.
// Vite may listen on IPv4 or IPv6 localhost only, so try to connect to both:
// a binding test on the wildcard address can succeed beside it.
function answers(host, port) {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

async function portIsFree(port) {
  const taken = await Promise.all([answers("127.0.0.1", port), answers("::1", port)]);
  return !taken.some(Boolean);
}

let server = null;
let serverExited = null;

function startServer() {
  server = spawn(join(ROOT, "node_modules", ".bin", "vite"), ["preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  serverExited = new Promise((resolve) => {
    server.once("exit", resolve);
    server.once("error", resolve);
  });
}

async function waitForServer() {
  let stopped = false;
  serverExited.then(() => (stopped = true));
  for (let i = 0; i < 100; i++) {
    if (stopped) throw new Error("vite preview stopped before answering; run `npm run build` first");
    const ok = await fetch(URL, { signal: AbortSignal.timeout(1000) }).then((r) => r.ok, () => false);
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
  if (!(await portIsFree(PORT))) throw new Error(`port ${PORT} is in use; stop whatever is serving it`);
  startServer();
  await waitForServer();
  const shots = await take();
  // Temporary names first, then rename, so a failed write replaces nothing.
  const files = { "title.png": shots.title, "gameplay.png": shots.run, "game-over.png": shots.over };
  for (const [name, buffer] of Object.entries(files)) writeFileSync(join(OUT, `.${name}.tmp`), buffer);
  for (const name of Object.keys(files)) renameSync(join(OUT, `.${name}.tmp`), join(OUT, name));
  console.log("Wrote screenshots/title.png, gameplay.png and game-over.png, 960x540 each.");
} catch (error) {
  console.error(`Nothing written. ${error.message}`);
  code = 1;
} finally {
  if (server) {
    server.kill();
    await serverExited;
  }
}
process.exit(code);
