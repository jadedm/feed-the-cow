# Contributing

Bug reports, ideas and pull requests are welcome.

- Bugs and feature requests: open an [issue](https://github.com/jadedm/feed-the-cow/issues/new/choose).
- Questions and open-ended ideas: start a [discussion](https://github.com/jadedm/feed-the-cow/discussions).

For anything bigger than a small fix, open an issue first so we can agree on the approach before you write it.

## Setup

You need Node.js 18, or 20 and later, and npm. The repo commits `package-lock.json`, so use npm rather than yarn or pnpm.

```bash
git clone https://github.com/jadedm/feed-the-cow.git
cd feed-the-cow
npm ci
npm run dev
```

The game opens at `http://localhost:8000`.

## Things to know before changing code

- This is Phaser 2, not Phaser 3. Examples written for Phaser 3 will not work.
- Phaser is loaded as a global with a plain script tag in `index.html`. Do not `import` it.
- Each game state in `src/` attaches itself to `window.feedTheCow` instead of exporting.
- Images and audio are loaded from string paths such as `src/images/BG.png`. Vite does not see them. If you add an asset folder or a script tag, add it to `scripts/copy-runtime-assets.mjs` too.
- Game balance (speeds, spawn positions, how many injections appear and when) lives in named constants near the top of `src/Game.js`. Change those rather than numbers inside functions.

## Checking a change

There is no automated test suite. Before opening a pull request:

```bash
npm run build
npm run check:assets
npm run preview
```

`check:assets` fails if any image, sound or script the game loads is missing from the build. Then play the game in the preview, on a phone-sized window too if you touched controls or layout.

Pull requests run the build and the asset check in CI.

## Branches and commits

- Branch name: a prefix, the issue number and a short slug, for example `fix/12-cow-leaves-screen`. Prefixes: `feature`, `fix`, `docs`, `chore`, `refactor`, `ci`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `fix: stop cow leaving the top of the screen`.
- Open the pull request against `main` and link the issue it closes.

## Art and audio

The game's images, audio and the woohoo brand are not under the MIT license (see [NOTICE.md](NOTICE.md)), so pull requests that add or change art or audio cannot be accepted under it. If you want to propose new art, open an issue first.

## License

By contributing code you agree that it is released under the [MIT License](LICENSE).
