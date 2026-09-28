# Contributing

Bug reports, ideas and pull requests are welcome.

- Bugs and feature requests: open an [issue](https://github.com/jadedm/feed-the-cow/issues/new/choose).
- Questions and open-ended ideas: start a [discussion](https://github.com/jadedm/feed-the-cow/discussions).

For anything bigger than a small fix, open an issue first so we can agree on the approach before you write it.

## Setup

You need Node.js 20 or later, and npm. CI runs on Node 22. The repo commits `package-lock.json`, so use npm rather than yarn or pnpm.

Fork the repo on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/feed-the-cow.git
cd feed-the-cow
npm ci
npm run dev
```

The game opens at `http://localhost:8000`.

## Things to know before changing code

- This is Phaser 2, not Phaser 3. Examples written for Phaser 3 will not work.
- Phaser is loaded as a global with a plain script tag in `index.html`. Do not `import` it.
- Each game state in `src/` attaches itself to `window.feedTheCow` instead of exporting.
- Images and audio are loaded from string paths such as `src/images/field.png`. Vite does not see them. If you add an asset folder or a script tag, add it to `scripts/copy-runtime-assets.mjs` too.
- Game balance (speeds, spawn positions, how many injections appear and when) lives in named constants near the top of `src/Game.js`. Change those rather than numbers inside functions.

## Checking a change

Before opening a pull request:

```bash
npx playwright install chromium firefox webkit   # once
npm run test:e2e
npm run preview
```

`npm run test:e2e` builds the game and runs the end-to-end tests in `tests/e2e/` against the build, in Chromium, Firefox, WebKit and a phone profile. They cover loading, the cow, item speeds at 30, 60 and 120 Hz, spacing, restarts, input and two full rounds of play. Run one file or test with `npx playwright test -g "joystick"`.

`npm run build` ends with an asset check (also available alone as `npm run check:assets`). It fails if an asset path written in the game code, `index.html` or the built CSS is missing from the build. It cannot see paths assembled at runtime, such as `"src/images/" + name`, so write asset paths as whole strings. Then play the game in the preview, on a phone-sized window too if you touched controls or layout.

Pull requests run the build and the end-to-end tests in CI.

When a test drives the game, read the canvas position right before each click (`gamePoint` in `tests/e2e/helpers.js`): the canvas is recentred after the first frames, so an early reading sends clicks off the canvas.

## Branches and commits

- Branch name: a prefix, the issue number and a short slug, for example `fix/12-cow-leaves-screen`. Prefixes: `feature`, `fix`, `docs`, `chore`, `refactor`, `ci`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `fix: stop cow leaving the top of the screen`.
- Push the branch to your fork and open the pull request against `main` here, linking the issue it closes.

## Art and audio

The game's images, audio, screenshots and the woohoo brand are not under the MIT license (see [NOTICE.md](NOTICE.md)). Pull requests that add or change art or audio will not be merged. If you want to propose new art, open an issue to discuss it first.

## License

By contributing code you agree that it is released under the [MIT License](LICENSE).
