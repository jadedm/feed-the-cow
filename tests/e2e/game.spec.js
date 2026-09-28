import { test } from "@playwright/test";
import {
  currentState,
  expect,
  exposeGame,
  gamePoint,
  openGame,
  phaserVersion,
  simulateDisplayHz,
  startGameDirectly,
  tapOrClick,
  watchErrors,
} from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await exposeGame(page);
});

test.describe("boot and assets", () => {
  test("loads to the start menu with no errors and no failed requests", async ({ page }) => {
    const errors = watchErrors(page);
    const failed = [];
    page.on("response", (response) => {
      if (response.url().includes("localhost") && response.status() >= 400) {
        failed.push(`${response.status()} ${response.url()}`);
      }
    });
    await openGame(page);
    expect(errors).toEqual([]);
    expect(failed).toEqual([]);
  });

  test("favicon and share image are served as images", async ({ page, request }) => {
    await openGame(page);
    const favicon = await page.evaluate(() => document.querySelector("link[rel=icon]").href);
    const faviconResponse = await request.get(favicon);
    expect(faviconResponse.status()).toBe(200);
    expect(faviconResponse.headers()["content-type"]).toContain("image/png");

    const shareImage = await request.get("/src/images/title.png");
    expect(shareImage.status()).toBe(200);
    expect(shareImage.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("cow", () => {
  test("plays all eight run frames", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const frames = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const cow = window.__game.state.getCurrentState().cow;
      const seen = new Set();
      for (let i = 0; i < 20; i++) {
        seen.add(cow.animations.frame);
        await sleep(60);
      }
      return { count: window.__game.cache.getFrameCount("cow"), seen: [...seen].sort() };
    });
    expect(frames.count).toBe(8);
    expect(frames.seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  test("collision box covers torso and head, not the legs", async ({ page }) => {
    await openGame(page);
    const hit = async (dx, dy) => {
      await startGameDirectly(page);
      return page.evaluate(
        async ([x, y]) => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const state = window.__game.state.getCurrentState();
          const C = window.feedTheCow.Game;
          const saved = C.INJECTION_SPEED;
          state.injectionGroup.forEachAlive((j) => j.kill());
          // Hold the injection still against the ground so it stays where placed.
          C.INJECTION_SPEED = -state.getScrollSpeed() * window.__game.time.desiredFps;
          const injection = state.injectionGroup.getFirstDead();
          injection.revive();
          injection.reset(state.cow.x + x, state.cow.y + y);
          await sleep(400);
          C.INJECTION_SPEED = saved;
          const body = state.cow.body;
          return {
            gameOver: state.gameOver,
            offset: [Math.round(body.x - state.cow.x), Math.round(body.y - state.cow.y)],
            size: [body.width, body.height],
          };
        },
        [dx, dy]
      );
    };
    const legs = await hit(50, 80);
    expect(legs.offset).toEqual([32, 12]);
    expect(legs.size).toEqual([120, 62]);
    expect(legs.gameOver).toBe(false);
    expect((await hit(70, 30)).gameOver).toBe(true);
    expect((await hit(110, 20)).gameOver).toBe(true);
  });
});

test.describe("speed is the same on any display rate", () => {
  for (const hz of [30, 60, 120]) {
    test(`${hz} Hz: ground 180 px/s, grass 120 and injections 245 over it`, async ({ page }) => {
      await simulateDisplayHz(page, hz);
      await openGame(page);
      test.skip(
        (await phaserVersion(page)).startsWith("2.4."),
        "Phaser 2.4 runs a fixed 60 Hz step and slows down when frames are late (#28)"
      );
      await startGameDirectly(page);
      const speeds = await page.evaluate(async () => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const state = window.__game.state.getCurrentState();
        state.timer.pause();
        state.secondsElapsed = 0;
        state.cow.body.moves = false;
        state.cow.y = -1000;
        const grass = state.grassGroup.getFirstAlive();
        const injection = state.injectionGroup.getFirstAlive();
        grass.reset(2400, 300);
        injection.reset(2400, 100);
        await sleep(300);
        const t0 = performance.now();
        const ground0 = state.background.tilePosition.x;
        const grass0 = grass.x;
        const injection0 = injection.x;
        await sleep(1500);
        const seconds = (performance.now() - t0) / 1000;
        const ground = -(state.background.tilePosition.x - ground0) / seconds;
        return {
          ground,
          grassOverGround: -(grass.x - grass0) / seconds - ground,
          injectionOverGround: -(injection.x - injection0) / seconds - ground,
        };
      });
      expect(speeds.ground).toBeGreaterThan(180 * 0.95);
      expect(speeds.ground).toBeLessThan(180 * 1.05);
      expect(speeds.grassOverGround).toBeGreaterThan(120 * 0.9);
      expect(speeds.grassOverGround).toBeLessThan(120 * 1.1);
      expect(speeds.injectionOverGround).toBeGreaterThan(245 * 0.95);
      expect(speeds.injectionOverGround).toBeLessThan(245 * 1.05);
    });
  }
});

test.describe("items", () => {
  test("no two items of a kind overlap with 23 injections on the field", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const samples = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const overlap = (a, b) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      const anyPair = (items) =>
        items.some((a, i) => items.slice(i + 1).some((b) => overlap(a, b)));
      const state = window.__game.state.getCurrentState();
      state.timer.pause();
      state.cow.body.moves = false;
      state.cow.y = -1000;
      state.spawnAdditionalInjections(21);
      let injectionOverlaps = 0;
      let grassOverlaps = 0;
      for (let i = 0; i < 100; i++) {
        await sleep(100);
        if (anyPair(state.injectionGroup.children.filter((x) => x.alive))) injectionOverlaps++;
        if (anyPair(state.grassGroup.children.filter((x) => x.alive))) grassOverlaps++;
      }
      return { injections: state.injectionGroup.countLiving(), injectionOverlaps, grassOverlaps };
    });
    expect(samples.injections).toBe(23);
    expect(samples.injectionOverlaps).toBe(0);
    expect(samples.grassOverlaps).toBe(0);
  });

  test("respawns never land on another item", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const landed = await page.evaluate(() => {
      const overlap = (a, b) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      const state = window.__game.state.getCurrentState();
      state.spawnAdditionalInjections(21);
      const injection = state.injectionGroup.getFirstAlive();
      const grass = state.grassGroup.getFirstAlive();
      let count = 0;
      for (let i = 0; i < 150; i++) {
        state.respawnInjection(injection);
        if (state.otherItems(injection).some((o) => overlap(injection, o))) count++;
        state.respawnGrass(grass);
        if (state.otherItems(grass).some((o) => overlap(grass, o))) count++;
      }
      return count;
    });
    expect(landed).toBe(0);
  });

  test("every grass scrolls through and respawns", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const neverRespawned = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = window.__game.state.getCurrentState();
      state.cow.body.moves = false;
      state.cow.y = -1000;
      const respawned = new Set();
      const original = state.respawnGrass;
      state.respawnGrass = function (grass) {
        respawned.add(grass);
        return original.call(this, grass);
      };
      await sleep(22_000);
      return state.grassGroup.children.filter((g) => !respawned.has(g)).length;
    });
    expect(neverRespawned).toBe(0);
  });

  test("injections are added at the progression thresholds", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const counts = await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      state.timer.pause();
      state.secondsElapsed = 0;
      const seen = {};
      for (let second = 1; second <= 50; second++) {
        state.updateSeconds();
        if ([9, 10, 20, 30, 40, 45, 50].includes(second)) seen[second] = state.injectionGroup.countLiving();
      }
      return seen;
    });
    expect(counts).toEqual({ 9: 2, 10: 3, 20: 5, 30: 7, 40: 10, 45: 15, 50: 23 });
  });
});

test.describe("lifecycle", () => {
  test("restarts do not add plugins or sounds", async ({ page }) => {
    await openGame(page);
    const perGame = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const game = window.__game;
      const counts = [];
      for (let i = 0; i < 3; i++) {
        game.state.start("Game");
        await sleep(300);
        counts.push([game.plugins.plugins.length, game.sound._sounds.length]);
        game.state.start("StartMenu");
        await sleep(300);
      }
      return counts;
    });
    expect(perGame.map((c) => c[0])).toEqual([1, 1, 1]);
    expect(new Set(perGame.map((c) => c[1])).size).toBe(1);
  });

  test("moves on from the loading screen if the music never decodes", async ({ page }) => {
    await page.addInitScript(() => {
      const stub = setInterval(() => {
        if (!window.Phaser || !window.Phaser.Cache) return;
        window.Phaser.Cache.prototype.isSoundDecoded = () => false;
        clearInterval(stub);
      }, 1);
    });
    await page.goto("/");
    await page.waitForFunction(() => window.__game && window.__game.state.current === "Preloader");
    const t0 = Date.now();
    await page.waitForFunction(() => window.__game.state.current === "StartMenu", null, {
      timeout: 15_000,
    });
    const seconds = (Date.now() - t0) / 1000;
    expect(seconds).toBeGreaterThan(4.5);
    expect(seconds).toBeLessThan(7);
  });
});

test.describe("input", () => {
  test("arrow keys move the cow without scrolling the page", async ({ page, isMobile }) => {
    test.skip(isMobile, "no keyboard on the phone profile");
    await openGame(page);
    await startGameDirectly(page);
    await page.evaluate(() => {
      window.__prevented = [];
      window.addEventListener("keydown", (e) => setTimeout(() => window.__prevented.push(e.defaultPrevented), 0));
    });
    const y0 = await page.evaluate(() => window.__game.state.getCurrentState().cow.y);
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowDown");
    const after = await page.evaluate(() => ({
      y: window.__game.state.getCurrentState().cow.y,
      prevented: window.__prevented[0],
      scrollY: window.scrollY,
    }));
    expect(after.y).toBeGreaterThan(y0 + 40);
    expect(after.prevented).toBe(true);
    expect(after.scrollY).toBe(0);
  });

  test("the joystick moves the cow", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse drag; touch is covered by the phone play-through");
    await openGame(page);
    await startGameDirectly(page);
    const y0 = await page.evaluate(() => window.__game.state.getCurrentState().cow.y);
    const [jx, jy] = await gamePoint(page, 860, 450);
    await page.mouse.move(jx, jy);
    await page.mouse.down();
    // Hold for a few frames first, as a finger would: the plugin only takes
    // the joystick if it sees the press inside its radius.
    await page.waitForTimeout(100);
    await page.mouse.move(jx, jy - 60, { steps: 4 });
    await page.waitForTimeout(400);
    const joystick = await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      return { inUse: state.joystick.properties.inUse, y: state.cow.y };
    });
    await page.mouse.up();
    expect(joystick.inUse).toBe(true);
    expect(joystick.y).toBeLessThan(y0 - 40);
  });

  test("dragging the cow moves it", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse drag");
    await openGame(page);
    await startGameDirectly(page);
    const cow = await page.evaluate(() => {
      const c = window.__game.state.getCurrentState().cow;
      return { x: c.x + c.width / 2, y: c.y + c.height / 2, top: c.y };
    });
    const [px, py] = await gamePoint(page, cow.x, cow.y);
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.mouse.move(px, py - 100, { steps: 5 });
    await page.mouse.up();
    const top = await page.evaluate(() => window.__game.state.getCurrentState().cow.y);
    expect(top).toBeLessThan(cow.top - 40);
  });
});

test.describe("game over", () => {
  test("two injections in one frame end the game once", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const result = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = window.__game.state.getCurrentState();
      let hurt = 0;
      const play = state.ouch.play.bind(state.ouch);
      state.ouch.play = (...args) => {
        hurt++;
        return play(...args);
      };
      state.injectionGroup.children.slice(0, 2).forEach((j) => j.reset(state.cow.x + 60, state.cow.y + 30));
      await sleep(300);
      const keys = [];
      window.__game.world.forEach((child) => keys.push(child.key));
      return {
        hitCows: keys.filter((k) => k === "deadCow").length,
        buttons: keys.filter((k) => k === "button").length,
        hurt,
      };
    });
    expect(result).toEqual({ hitCows: 1, buttons: 1, hurt: 1 });
  });
});

test.describe("full play", () => {
  test("two rounds with real input: start, eat, get hit, try again", async ({ page, isMobile }) => {
    const errors = watchErrors(page);
    await openGame(page);
    await page.waitForTimeout(500);
    for (let round = 1; round <= 2; round++) {
      await tapOrClick(page, 480, 270, isMobile);
      await page.waitForFunction(() => {
        const game = window.__game;
        return game.state.current === "Game" && game.state.getCurrentState().cow;
      });
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const state = window.__game.state.getCurrentState();
        state.grassGroup.getFirstAlive().reset(state.cow.x + 80, state.cow.y + 30);
      });
      await page.waitForTimeout(150);
      expect(await page.evaluate(() => window.__game.state.getCurrentState().scoreText.text)).toBe("score: 10");
      await page.evaluate(() => {
        const state = window.__game.state.getCurrentState();
        state.injectionGroup.getFirstAlive().reset(state.cow.x + 80, state.cow.y + 30);
      });
      await page.waitForFunction(() => window.__game.state.getCurrentState().gameOver === true);
      await page.waitForTimeout(500);
      const button = await page.evaluate(() => {
        const b = window.__game.state.getCurrentState().overMessage;
        return [b.x + b.width / 2, b.y + b.height / 2];
      });
      await tapOrClick(page, button[0], button[1], isMobile);
      await page.waitForFunction(() => window.__game.state.current === "StartMenu");
      expect(await currentState(page)).toBe("StartMenu");
      await page.waitForTimeout(300);
    }
    expect(errors).toEqual([]);
  });
});
