// Shared setup for the end-to-end tests.
//
// The game keeps its Phaser.Game instance in a local variable, and Phaser CE
// has no Phaser.GAMES list, so an init script wraps Phaser.Game#boot to
// expose the instance as window.__game before the game starts.
import { expect } from "@playwright/test";

export async function exposeGame(page) {
  await page.addInitScript(() => {
    const hook = setInterval(() => {
      if (!window.Phaser || !window.Phaser.Game) return;
      const boot = window.Phaser.Game.prototype.boot;
      window.Phaser.Game.prototype.boot = function () {
        window.__game = this;
        return boot.apply(this, arguments);
      };
      clearInterval(hook);
    }, 1);
  });
}

// Replaces requestAnimationFrame with a timer at the given rate, so a test
// can check that the game runs at the same real-time speed on a 30, 60 or
// 120 Hz display.
export async function simulateDisplayHz(page, hz) {
  await page.addInitScript((rate) => {
    window.requestAnimationFrame = (callback) =>
      setTimeout(() => callback(performance.now()), 1000 / rate);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }, hz);
}

// Collects console errors and uncaught exceptions for the page's lifetime.
// Chrome logs this intervention when a synthetic tap's touchstart is not
// cancelable and Phaser calls preventDefault on it. It comes from the test's
// tap, not from the game.
const BROWSER_NOISE = [/^Ignored attempt to cancel a touch\w+ event with cancelable=false/];

export function watchErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() !== "error" || BROWSER_NOISE.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

export async function openGame(page) {
  await page.goto("/");
  await page.waitForFunction(
    () => window.__game && window.__game.state.current === "StartMenu",
    null,
    { timeout: 20_000 }
  );
}

// state.start() only switches on the next frame, so wait for the new game's
// cow, not whatever cow the previous game left behind.
export async function startGameDirectly(page) {
  await page.evaluate(() => {
    const previous = window.__game.state.getCurrentState();
    window.__previousCow = (previous && previous.cow) || null;
    window.__game.state.start("Game");
  });
  await page.waitForFunction(() => {
    const game = window.__game;
    const cow = game.state.getCurrentState().cow;
    return game.state.current === "Game" && cow && cow !== window.__previousCow && cow.alive;
  });
}

export async function phaserVersion(page) {
  return page.evaluate(() => window.Phaser.VERSION);
}

// Page coordinates of a point in the 960x540 game. Read right before every
// click: the scale manager centres the canvas after the first frames, so a
// position read once at load goes stale (#16).
export async function gamePoint(page, x, y) {
  const box = await page.locator("canvas").boundingBox();
  return [box.x + (x * box.width) / 960, box.y + (y * box.height) / 540];
}

export async function tapOrClick(page, x, y, isMobile) {
  const [px, py] = await gamePoint(page, x, y);
  if (isMobile) {
    await page.touchscreen.tap(px, py);
    return;
  }
  await page.mouse.click(px, py, { delay: 80 });
}

export async function currentState(page) {
  return page.evaluate(() => window.__game.state.current);
}

export { expect };
