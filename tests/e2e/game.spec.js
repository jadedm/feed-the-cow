import {
  currentState,
  drag,
  expect,
  openGame,
  simulateDisplayHz,
  stampStateStarts,
  startGameDirectly,
  tapOrClick,
  test,
} from "./helpers.js";

test.describe("boot and assets", () => {
  test("loads to the start menu with no failed requests", async ({ page }) => {
    const failed = [];
    page.on("response", (response) => {
      if (response.url().includes("localhost") && response.status() >= 400) {
        failed.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on("requestfailed", (request) => failed.push(`failed ${request.url()}`));
    await openGame(page);
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
      // Each frame shows about 71 ms at 14 fps; sample well inside that, for
      // two full cycles, so a slow runner cannot step over a frame.
      for (let i = 0; i < 75; i++) {
        seen.add(cow.animations.frame);
        await sleep(20);
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

  test("a respawn moves the item off-screen right, clear of every other item", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const result = await page.evaluate(() => {
      const overlap = (a, b) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      const state = window.__game.state.getCurrentState();
      const spawnXMin = window.feedTheCow.Game.SPAWN_X_MIN;
      state.timer.pause();
      state.spawnAdditionalInjections(21);
      const injection = state.injectionGroup.getFirstAlive();
      const grass = state.grassGroup.getFirstAlive();
      let landedOnAnother = 0;
      let notMoved = 0;
      for (let i = 0; i < 150; i++) {
        for (const [item, respawn] of [
          [injection, () => state.respawnInjection(injection)],
          [grass, () => state.respawnGrass(grass)],
        ]) {
          item.reset(-500, 200);
          respawn();
          if (item.x < spawnXMin) notMoved++;
          if (state.otherItems(item).some((o) => overlap(item, o))) landedOnAnother++;
        }
      }
      return { landedOnAnother, notMoved };
    });
    expect(result).toEqual({ landedOnAnother: 0, notMoved: 0 });
  });

  test("grass spawns only below the sky and within the cow's reach", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const ys = await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      state.timer.pause();
      const ys = state.grassGroup.children.map((g) => g.y);
      for (let i = 0; i < 300; i++) {
        state.grassGroup.children.forEach((g) => {
          state.respawnGrass(g);
          ys.push(g.y);
        });
      }
      return ys;
    });
    // The sky in the field image reaches y 105; the cow's box reaches y 514,
    // so a 30 px tall grass must start between 110 and 484.
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(110);
    expect(Math.max(...ys) + 30).toBeLessThanOrEqual(514);
    // The whole band is used, not a sliver of it.
    expect(Math.min(...ys)).toBeLessThan(130);
    expect(Math.max(...ys)).toBeGreaterThan(464);
  });

  test("the cow at its lowest eats grass at the lowest spawn line", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    await page.evaluate(() => {
      const state = window.__game.state.getCurrentState();
      state.timer.pause();
      state.injectionGroup.forEachAlive((j) => j.kill());
      state.cow.x = 200;
      state.cow.y = 1000;
    });
    // One frame for the field bounds to pull the cow back to its lowest.
    await page.waitForTimeout(100);
    const result = await page.evaluate(async () => {
      const state = window.__game.state.getCurrentState();
      const lowest = state.cow.y;
      const before = state.score;
      const grass = state.grassGroup.getFirstAlive();
      grass.reset(state.cow.x + 60, window.feedTheCow.Game.SPAWN_Y_MAX_GRASS);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return { lowest, gained: state.score - before };
    });
    expect(result.lowest).toBe(440);
    expect(result.gained).toBeGreaterThan(0);
  });

  test("every grass scrolls off the left and comes back on the right", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const result = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = window.__game.state.getCurrentState();
      const spawnXMin = window.feedTheCow.Game.SPAWN_X_MIN;
      state.cow.body.moves = false;
      state.cow.y = -1000;
      const cameBack = new Set();
      const landedLeft = [];
      const original = state.respawnGrass;
      state.respawnGrass = function (grass) {
        const result = original.call(this, grass);
        if (grass.x >= spawnXMin) cameBack.add(grass);
        else landedLeft.push(Math.round(grass.x));
        return result;
      };
      await sleep(22_000);
      return {
        neverCameBack: state.grassGroup.children.filter((g) => !cameBack.has(g)).length,
        landedLeft,
      };
    });
    expect(result).toEqual({ neverCameBack: 0, landedLeft: [] });
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

  test("the game clock counts real seconds", async ({ page }) => {
    await openGame(page);
    await startGameDirectly(page);
    const elapsed = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = window.__game.state.getCurrentState();
      const before = state.secondsElapsed;
      await sleep(3200);
      return state.secondsElapsed - before;
    });
    expect(elapsed).toBeGreaterThanOrEqual(2);
    expect(elapsed).toBeLessThanOrEqual(4);
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

  test("leaves the loading screen as soon as the music decodes", async ({ page }) => {
    await stampStateStarts(page);
    await openGame(page);
    const seconds = await page.evaluate(
      () => (window.__stateStarted.StartMenu - window.__stateStarted.Preloader) / 1000
    );
    expect(seconds).toBeLessThan(4);
  });

  test("leaves the loading screen after 5 s if the music never decodes", async ({ page }) => {
    await stampStateStarts(page);
    await page.addInitScript(() => {
      const stub = setInterval(() => {
        if (!window.Phaser || !window.Phaser.Cache) return;
        window.Phaser.Cache.prototype.isSoundDecoded = () => false;
        clearInterval(stub);
      }, 1);
    });
    await openGame(page);
    const seconds = await page.evaluate(
      () => (window.__stateStarted.StartMenu - window.__stateStarted.Preloader) / 1000
    );
    expect(seconds).toBeGreaterThan(4.8);
    expect(seconds).toBeLessThan(6);
  });
});

test.describe("input", () => {
  for (const [key, direction] of [
    ["ArrowDown", 1],
    ["ArrowUp", -1],
  ]) {
    test(`${key} moves the cow and does not scroll the page`, async ({ page, isMobile }) => {
      test.skip(isMobile, "no keyboard on the phone profile");
      await openGame(page);
      await startGameDirectly(page);
      await page.evaluate(() => {
        window.__prevented = [];
        window.addEventListener("keydown", (e) =>
          setTimeout(() => window.__prevented.push(e.defaultPrevented), 0)
        );
      });
      const y0 = await page.evaluate(() => window.__game.state.getCurrentState().cow.y);
      await page.keyboard.down(key);
      await page.waitForTimeout(300);
      await page.keyboard.up(key);
      const after = await page.evaluate(() => ({
        y: window.__game.state.getCurrentState().cow.y,
        prevented: window.__prevented[0],
      }));
      expect((after.y - y0) * direction).toBeGreaterThan(40);
      expect(after.prevented).toBe(true);
    });
  }

  test("the joystick moves the cow, by mouse or touch", async ({ page, isMobile }) => {
    await openGame(page);
    await startGameDirectly(page);
    const y0 = await page.evaluate(() => window.__game.state.getCurrentState().cow.y);
    const during = () =>
      page.evaluate(() => {
        const state = window.__game.state.getCurrentState();
        return { inUse: state.joystick.properties.inUse, y: state.cow.y };
      });
    const joystick = await drag(page, isMobile, [860, 450], [860, 390], { during });
    expect(joystick.inUse).toBe(true);
    expect(joystick.y).toBeLessThan(y0 - 40);
  });

  test("dragging the cow moves it, by mouse or touch", async ({ page, isMobile }) => {
    await openGame(page);
    await startGameDirectly(page);
    const cow = await page.evaluate(() => {
      const c = window.__game.state.getCurrentState().cow;
      return { x: c.x + c.width / 2, y: c.y + c.height / 2, top: c.y };
    });
    await drag(page, isMobile, [cow.x, cow.y], [cow.x, cow.y - 100], { holdMs: 800 });
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
  // Starting and restarting use real clicks or taps. Grass and the injection
  // are placed on the cow by the test, since waiting for random spawns to
  // reach the cow would make the run slow and flaky.
  test("two rounds: tap to start, eat placed grass, hit by placed injection, tap try again", async ({
    page,
    isMobile,
  }) => {
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
  });
});

