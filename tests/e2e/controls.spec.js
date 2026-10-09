import { drag, expect, openGame, simulateDisplayHz, startGameDirectly, test } from "./helpers.js";

const TOP_SPEED = 450;

// Starts a game with nothing that can end it: no injections, no timer.
async function quietGame(page) {
  await openGame(page);
  await startGameDirectly(page);
  await page.evaluate(() => {
    const state = window.__game.state.getCurrentState();
    state.timer.pause();
    state.injectionGroup.forEachAlive((j) => j.kill());
    state.cow.x = 200;
    state.cow.y = 220;
  });
}

// Samples the cow's position every animation frame while `action` runs.
async function trackCow(page, action) {
  await page.evaluate(() => {
    window.__track = [];
    window.__tracking = true;
    const sample = () => {
      const cow = window.__game.state.getCurrentState().cow;
      window.__track.push({ t: performance.now(), x: cow.x, y: cow.y });
      if (window.__tracking) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await action();
  return page.evaluate(() => {
    window.__tracking = false;
    return window.__track;
  });
}

// Highest speed between samples at least 100 ms apart, in px/s. Shorter
// windows pick up frame-timing jitter rather than real speed.
function peakSpeed(track) {
  let peak = 0;
  let last = track[0];
  for (const point of track.slice(1)) {
    const dt = (point.t - last.t) / 1000;
    if (dt < 0.1) continue;
    const speed = Math.hypot(point.x - last.x, point.y - last.y) / dt;
    peak = Math.max(peak, speed);
    last = point;
  }
  return peak;
}

async function cowPosition(page) {
  return page.evaluate(() => {
    const cow = window.__game.state.getCurrentState().cow;
    return { x: cow.x, y: cow.y };
  });
}

test.describe("keys", () => {
  const cases = [
    ["ArrowUp", 0, -1],
    ["ArrowDown", 0, 1],
    ["ArrowLeft", -1, 0],
    ["ArrowRight", 1, 0],
    ["w", 0, -1],
    ["s", 0, 1],
    ["a", -1, 0],
    ["d", 1, 0],
  ];
  for (const [key, dx, dy] of cases) {
    test(`${key} moves the cow only that way`, async ({ page, isMobile }) => {
      test.skip(isMobile, "no keyboard on the phone profile");
      await quietGame(page);
      const before = await cowPosition(page);
      await page.keyboard.down(key);
      await page.waitForTimeout(300);
      await page.keyboard.up(key);
      const after = await cowPosition(page);
      const moveX = after.x - before.x;
      const moveY = after.y - before.y;
      if (dx) {
        expect(moveX * dx).toBeGreaterThan(40);
        expect(Math.abs(moveY)).toBeLessThan(2);
      } else {
        expect(moveY * dy).toBeGreaterThan(40);
        expect(Math.abs(moveX)).toBeLessThan(2);
      }
    });
  }

  test("a diagonal is no faster than one direction", async ({ page, isMobile }) => {
    test.skip(isMobile, "no keyboard on the phone profile");
    await quietGame(page);
    await page.evaluate(() => {
      const cow = window.__game.state.getCurrentState().cow;
      cow.x = 100;
      cow.y = 400;
    });
    const track = await trackCow(page, async () => {
      await page.keyboard.down("ArrowUp");
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(900);
      await page.keyboard.up("ArrowUp");
      await page.keyboard.up("ArrowRight");
    });
    const peak = peakSpeed(track);
    expect(peak).toBeGreaterThan(TOP_SPEED * 0.9);
    expect(peak).toBeLessThan(TOP_SPEED * 1.08);
  });

  test("a key press accelerates the cow instead of jumping to top speed", async ({ page, isMobile }) => {
    test.skip(isMobile, "no keyboard on the phone profile");
    await quietGame(page);
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(60);
    const early = await page.evaluate(() => window.__game.state.getCurrentState().cow.body.velocity.x);
    await page.waitForTimeout(400);
    const later = await page.evaluate(() => window.__game.state.getCurrentState().cow.body.velocity.x);
    await page.keyboard.up("ArrowRight");
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(TOP_SPEED * 0.9);
    expect(later).toBeGreaterThan(TOP_SPEED * 0.95);
  });

  test("released keys ease the cow to a stop, not an instant halt", async ({ page, isMobile }) => {
    test.skip(isMobile, "no keyboard on the phone profile");
    await quietGame(page);
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.__afterRelease = [];
      window.__sampling = true;
      const sample = () => {
        window.__afterRelease.push(window.__game.state.getCurrentState().cow.body.velocity.x);
        if (window.__sampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(600);
    const speeds = await page.evaluate(() => {
      window.__sampling = false;
      return window.__afterRelease;
    });
    const firstFall = speeds.findIndex((v, i) => i > 0 && v < speeds[i - 1] - 1);
    expect(firstFall).toBeGreaterThan(0);
    expect(speeds[firstFall]).toBeGreaterThan(TOP_SPEED * 0.3);
    expect(speeds[speeds.length - 1]).toBeLessThan(TOP_SPEED * 0.05);
  });

  test("the whole cow stays in its part of the field against every edge", async ({ page, isMobile }) => {
    test.skip(isMobile, "no keyboard on the phone profile");
    await quietGame(page);
    const seen = { minX: Infinity, minY: Infinity, maxRight: -Infinity, maxBottom: -Infinity };
    for (const key of ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"]) {
      await page.keyboard.down(key);
      await page.waitForTimeout(1800);
      const box = await page.evaluate(() => {
        const cow = window.__game.state.getCurrentState().cow;
        return { x: cow.x, y: cow.y, right: cow.x + cow.width, bottom: cow.y + cow.height };
      });
      await page.keyboard.up(key);
      seen.minX = Math.min(seen.minX, box.x);
      seen.minY = Math.min(seen.minY, box.y);
      seen.maxRight = Math.max(seen.maxRight, box.right);
      seen.maxBottom = Math.max(seen.maxBottom, box.bottom);
    }
    // Inside the field, and the cow's right edge stops at 720 so injections
    // entering at 960 can be seen coming.
    expect(seen.minX).toBeGreaterThanOrEqual(0);
    expect(seen.minY).toBeGreaterThanOrEqual(0);
    expect(seen.maxRight).toBeLessThanOrEqual(720);
    expect(seen.maxBottom).toBeLessThanOrEqual(540);
    // And it reaches each limit, so the bounds are not simply too small.
    expect(seen.minX).toBeLessThan(2);
    expect(seen.minY).toBeLessThan(2);
    expect(seen.maxRight).toBeGreaterThan(718);
    expect(seen.maxBottom).toBeGreaterThan(538);
  });
});

test.describe("joystick", () => {
  test("steers in both axes", async ({ page, isMobile }) => {
    await quietGame(page);
    const before = await cowPosition(page);
    await drag(page, isMobile, [860, 450], [900, 410], { holdMs: 500 });
    const after = await cowPosition(page);
    expect(after.x - before.x).toBeGreaterThan(40);
    expect(before.y - after.y).toBeGreaterThan(40);
  });

  test("the joystick is never covered by the cow", async ({ page }) => {
    await quietGame(page);
    const reach = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const state = window.__game.state.getCurrentState();
      state.cow.x = 900;
      state.cow.y = 500;
      await sleep(200);
      return { right: state.cow.x + state.cow.width, joystickLeft: 860 - 50 };
    });
    expect(reach.right).toBeLessThanOrEqual(reach.joystickLeft);
  });
});

test.describe("drag", () => {
  test("the cow follows a drag in both axes", async ({ page, isMobile }) => {
    await quietGame(page);
    const start = await cowPosition(page);
    await drag(page, isMobile, [start.x + 80, start.y + 45], [start.x + 280, start.y - 55], { holdMs: 1500 });
    const end = await cowPosition(page);
    expect(end.x - start.x).toBeGreaterThan(180);
    expect(start.y - end.y).toBeGreaterThan(80);
  });

  test("a drag top to bottom takes time, never faster than top speed", async ({ page, isMobile }) => {
    await quietGame(page);
    await page.evaluate(() => {
      const cow = window.__game.state.getCurrentState().cow;
      cow.x = 300;
      cow.y = 0;
    });
    await page.waitForTimeout(100);
    const track = await trackCow(page, () =>
      drag(page, isMobile, [380, 45], [380, 485], { holdMs: 2500 })
    );
    const pressedAt = track[0].t;
    const arrived = track.find((p) => p.y >= 430);
    expect(arrived, "cow reached the bottom").toBeTruthy();
    // 440 px at 450 px/s is 0.98 s before any easing in or out.
    expect((arrived.t - pressedAt) / 1000).toBeGreaterThan(0.9);
    expect(peakSpeed(track)).toBeLessThan(TOP_SPEED * 1.08);
  });

  test("the cow eases to a stop on the drag point without overshooting", async ({ page, isMobile }) => {
    await quietGame(page);
    const start = await cowPosition(page);
    // Diagonal, so the horizontal grab offset is checked as well as the vertical.
    const target = { x: start.x + 150, y: start.y - 150 };
    const track = await trackCow(page, () =>
      drag(page, isMobile, [start.x + 80, start.y + 45], [target.x + 80, target.y + 45], { holdMs: 3000 })
    );
    const final = track[track.length - 1];
    const overshootY = Math.max(0, ...track.map((p) => target.y - p.y));
    const overshootX = Math.max(0, ...track.map((p) => p.x - target.x));
    expect(Math.abs(final.y - target.y)).toBeLessThan(3);
    expect(Math.abs(final.x - target.x)).toBeLessThan(3);
    expect(overshootY).toBeLessThan(2);
    expect(overshootX).toBeLessThan(2);
    // Slowing down near the point: the last 60 px take longer than 60 px at top speed.
    const at60 = track.find((p) => p.y <= target.y + 60);
    const at5 = track.find((p) => p.y <= target.y + 5);
    expect((at5.t - at60.t) / 1000).toBeGreaterThan(55 / TOP_SPEED);
  });

  test("a long frame never carries the dragged cow past the drag point", async ({ page }) => {
    await quietGame(page);
    const step = await page.evaluate(() => {
      const game = window.__game;
      const state = game.state.getCurrentState();
      // A drag point 10 px above the cow, the cow already at top speed toward
      // it, and one 200 ms frame (Phaser's longest).
      state.dragGrab = { x: 0, y: 0 };
      state.dragPointer = { worldX: state.cow.x, worldY: state.cow.y - 10 };
      state.cow.body.velocity.x = 0;
      state.cow.body.velocity.y = -window.feedTheCow.Game.COW_TOP_SPEED;
      const delta = Object.getOwnPropertyDescriptor(game.time, "delta");
      Object.defineProperty(game.time, "delta", { value: 200, configurable: true, writable: true });
      state.moveCow();
      if (delta) Object.defineProperty(game.time, "delta", delta);
      else delete game.time.delta;
      const travel = -state.cow.body.velocity.y * 0.2;
      state.dragPointer = null;
      state.dragGrab = null;
      return { travel, distance: 10 };
    });
    expect(step.travel).toBeLessThanOrEqual(step.distance + 0.01);
    expect(step.travel).toBeGreaterThan(0);
  });
});

test.describe("same feel on any display rate", () => {
  for (const hz of [30, 60, 120]) {
    test(`${hz} Hz: same easing and top speed ${TOP_SPEED} px/s`, async ({ page, isMobile }) => {
      test.skip(isMobile, "keyboard");
      await simulateDisplayHz(page, hz);
      await quietGame(page);
      await page.evaluate(() => {
        const cow = window.__game.state.getCurrentState().cow;
        cow.x = 0;
      });
      // How fast the speed rises, not when it starts: the time between 30%
      // and 80% of top speed. For easing with a 0.08 s response time that is
      // 0.08 x ln(0.7 / 0.2) = 0.10 s at any display rate, and it does not
      // depend on when the game first sees the key. Easing counted per frame
      // instead of by time gives about 0.20 s at 30 Hz and 0.05 s at 120 Hz.
      await page.evaluate(() => {
        window.__speeds = [];
        window.__sampling = true;
        const sample = () => {
          const cow = window.__game.state.getCurrentState().cow;
          window.__speeds.push({ t: performance.now(), v: cow.body.velocity.x, x: cow.x });
          if (window.__sampling) requestAnimationFrame(sample);
        };
        // One sample now, at rest, so the first crossing has a point before it
        // even when the next frame comes after the key press.
        sample();
      });
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(1000);
      await page.keyboard.up("ArrowRight");
      const { rise, topSpeed } = await page.evaluate((top) => {
        window.__sampling = false;
        const speeds = window.__speeds;
        // Time the speed crosses `level`, interpolated between samples.
        const crossing = (level) => {
          const i = speeds.findIndex((s) => s.v >= level);
          if (i < 1) return null;
          const a = speeds[i - 1];
          const b = speeds[i];
          return a.t + ((level - a.v) / (b.v - a.v)) * (b.t - a.t);
        };
        const t30 = crossing(top * 0.3);
        const t80 = crossing(top * 0.8);
        if (t30 === null || t80 === null) return { rise: null, topSpeed: null };
        // Top speed from positions and page timestamps, 0.3 to 0.7 s after the
        // rise began: fully up to speed, and well before the cow's 560 px limit.
        const at = (ms) => speeds.find((s) => s.t >= t30 + ms);
        const a = at(300);
        const b = at(700);
        const topSpeed = a && b ? (b.x - a.x) / ((b.t - a.t) / 1000) : null;
        return { rise: (t80 - t30) / 1000, topSpeed };
      }, TOP_SPEED);
      expect(rise).toBeGreaterThan(0.07);
      expect(rise).toBeLessThan(0.15);
      expect(topSpeed).toBeGreaterThan(TOP_SPEED * 0.95);
      expect(topSpeed).toBeLessThan(TOP_SPEED * 1.05);
    });
  }
});

test.describe("collisions from anywhere", () => {
  for (const [x, y] of [[0, 0], [560, 0], [0, 440], [560, 440], [300, 220]]) {
    test(`cow at ${x},${y}: grass scores, an injection ends the game`, async ({ page }) => {
      await quietGame(page);
      const result = await page.evaluate(
        async ([cx, cy]) => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const state = window.__game.state.getCurrentState();
          state.cow.x = cx;
          state.cow.y = cy;
          await sleep(100);
          // Only the placed grass: others arriving from the right would add score.
          state.grassGroup.forEachAlive((g) => g.kill());
          const grass = state.grassGroup.getFirstDead();
          grass.revive();
          grass.reset(state.cow.x + 70, state.cow.y + 25);
          await sleep(150);
          const score = state.score;
          const injection = state.injectionGroup.getFirstDead();
          injection.revive();
          injection.reset(state.cow.x + 70, state.cow.y + 30);
          await sleep(200);
          return { score, gameOver: state.gameOver };
        },
        [x, y]
      );
      expect(result).toEqual({ score: 10, gameOver: true });
    });
  }
});
