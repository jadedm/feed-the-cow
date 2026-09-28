// Shared setup for the end-to-end tests.
//
// `test` here is Playwright's test with two automatic fixtures: every page
// exposes the running Phaser.Game as window.__game, and every test fails if
// the page logged a console error or threw.
import { test as base, expect } from "@playwright/test";

// The game keeps its Phaser.Game in a local variable. Phaser.GAMES would also
// reach it on 2.4, but Phaser CE removed that list, so wrap Game#boot instead.
async function exposeGame(page) {
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

// Chrome logs this intervention when a synthetic tap's touchstart is not
// cancelable and Phaser calls preventDefault on it. It comes from the test's
// tap, not from the game.
const BROWSER_NOISE = [/^Ignored attempt to cancel a touch\w+ event with cancelable=false/];

function watchErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() !== "error" || BROWSER_NOISE.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await exposeGame(page);
    await use(page);
  },
  pageErrors: [
    async ({ page }, use) => {
      const errors = watchErrors(page);
      await use(errors);
      expect(errors, "console errors or uncaught exceptions").toEqual([]);
    },
    { auto: true },
  ],
});

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

// Records when each game state's create() runs, as window.__stateStarted.
export async function stampStateStarts(page) {
  await page.addInitScript(() => {
    window.__stateStarted = {};
    const hook = setInterval(() => {
      const states = window.feedTheCow;
      if (!states || !states.Preloader || !states.StartMenu) return;
      ["Preloader", "StartMenu"].forEach((name) => {
        const create = states[name].prototype.create;
        states[name].prototype.create = function () {
          window.__stateStarted[name] = performance.now();
          return create.apply(this, arguments);
        };
      });
      clearInterval(hook);
    }, 1);
  });
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

// Presses at `from`, holds, moves to `to` in steps, and releases after
// `holdMs`, in game coordinates. Uses touch on the phone profile (through
// Chromium's DevTools protocol, since Playwright has no touch drag) and the
// mouse elsewhere. `during` runs while the pointer is still down.
export async function drag(page, isMobile, from, to, { holdMs = 400, during } = {}) {
  const [x0, y0] = await gamePoint(page, ...from);
  const [x1, y1] = await gamePoint(page, ...to);
  const steps = 6;
  if (!isMobile) {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    // Hold for a few frames first, as a finger would: the gamepad plugin only
    // takes the joystick if it sees the press inside its radius.
    await page.waitForTimeout(100);
    await page.mouse.move(x1, y1, { steps });
    await page.waitForTimeout(holdMs);
    const result = during ? await during() : undefined;
    await page.mouse.up();
    return result;
  }
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x, y) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }],
    });
  await touch("touchStart", x0, y0);
  await page.waitForTimeout(100);
  for (let i = 1; i <= steps; i++) {
    await touch("touchMove", x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(holdMs);
  const result = during ? await during() : undefined;
  await touch("touchEnd", x1, y1);
  await cdp.detach();
  return result;
}

export async function currentState(page) {
  return page.evaluate(() => window.__game.state.current);
}

export { expect };
