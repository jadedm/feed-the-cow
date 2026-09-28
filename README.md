# Feed The Cow

A browser arcade game built with Phaser 2 for World Milk Day. Steer the cow up and down to eat green fodder and avoid the injections.

[![GitHub stars](https://img.shields.io/github/stars/jadedm/feed-the-cow?style=social)](https://github.com/jadedm/feed-the-cow)

## Screenshots

<div align="center">

### Title screen
![Title screen](screenshots/feed-the-cow-3.png)

### Gameplay
![Gameplay](screenshots/feed-the-cow-2.png)

### Game over
![Game over](screenshots/feed-the-cow-1.png)

</div>

## About

The game was made to draw attention to what cattle eat. In India there is a large gap between the demand for feed and fodder and the supply. Many cows live on man-made concentrates, which raise milk output but harm the animal's health over time, so medicines and injections become routine.

The game makes the point directly: fresh green fodder keeps the cow going, and injections end the run.

## Features

- The background scrolls faster the longer you survive, following a square-root curve.
- Injection count climbs from 2 to 23 over the first 50 seconds.
- Three ways to control the cow: drag with mouse or touch, arrow keys, or an on-screen joystick.
- Runs in desktop and mobile browsers. The 960x540 canvas scales down to fit smaller screens, to a minimum of 480x260.
- Sound effects and background music.

## Controls

| Input | Action |
| --- | --- |
| Mouse or touch | Drag the cow up or down |
| Arrow keys | Up and down move the cow |
| On-screen joystick | Touch or click and drag, bottom right of the screen |

## How to play

1. Move the cow up and down to eat the green fodder.
2. Each piece of fodder scores 10 points.
3. Avoid the injections. One hit ends the game.
4. The background speeds up and more injections appear over time. Survive as long as you can.

## Getting started

### Prerequisites

- Node.js 20 or later. CI runs on Node 22.
- npm. The repo commits `package-lock.json`, and the Dockerfile runs `npm ci`, so use npm rather than yarn or pnpm.

### Run locally

```bash
git clone https://github.com/jadedm/feed-the-cow.git
cd feed-the-cow
npm ci
npm run dev
```

The dev server opens the game at `http://localhost:8000`.

### Production build

```bash
npm run build
npm run preview
```

Phaser loads images and sounds at runtime from paths such as `src/images/BG.png`. Vite cannot see those paths, so `npm run build` runs `vite build` and then `scripts/copy-runtime-assets.mjs`, which copies the images, audio, Phaser and the gamepad plugin into `dist/src/`. A new asset folder or script tag needs adding to that script.

`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch.

### Docker

```bash
docker compose up --build
```

The game is served by nginx at `http://localhost:8080`.

## Tech stack

- Game engine: [Phaser 2](https://phaser.io/). This is Phaser 2, not Phaser 3; the APIs differ.
- Build tool: [Vite](https://vitejs.dev/)
- Language: JavaScript (ES modules)
- On-screen joystick: [Phaser Virtual Gamepad](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad), patched to run with a joystick and no button

## Project structure

```
feed-the-cow/
├── src/
│   ├── audio/          # Sound effects and music
│   ├── css/            # Stylesheets
│   ├── images/         # Sprites and backgrounds
│   ├── libs/           # Phaser and plugins, loaded as plain scripts
│   ├── Boot.js         # Canvas and scaling setup
│   ├── Preloader.js    # Asset loading
│   ├── StartMenu.js    # Title screen
│   └── Game.js         # Gameplay and tuning constants
├── screenshots/        # Images used in this README
├── index.html
├── main.js             # Creates the Phaser game and registers the states
├── scripts/            # Build helpers: asset copy and asset check
├── .github/            # CI workflow
├── vite.config.js
├── jsdoc.json
├── Dockerfile          # Two-stage build served by nginx
├── docker-compose.yml
├── nginx.conf
└── package.json
```

## API documentation

```bash
npm run docs
```

This writes JSDoc output to `docs/`. Open `docs/index.html` to read it.

## Game mechanics

### Speed

Background scroll speed is `3 + √(seconds) × 0.5` pixels per frame:

| Time | Speed (px/frame) |
| --- | --- |
| 0s | 3 |
| 16s | 5 |
| 36s | 6 |
| 64s | 7 |

Only the background speeds up, with no upper limit. Fodder and injections move at fixed speed ranges set in `src/Game.js`.

### Injection spawning

| Time | Injections added | Total |
| --- | --- | --- |
| 0s | 2 | 2 |
| 10s | 1 | 3 |
| 20s | 2 | 5 |
| 30s | 2 | 7 |
| 40s | 3 | 10 |
| 45s | 5 | 15 |
| 50s | 8 | 23 |

These values live as named constants near the top of `src/Game.js`. Change them there to rebalance the game.

## Contributing

Bug reports and ideas go in [Issues](https://github.com/jadedm/feed-the-cow/issues). Questions and open-ended discussion go in [Discussions](https://github.com/jadedm/feed-the-cow/discussions).

To send a change:

1. Fork the repo and create a branch, for example `feature/12-touch-sensitivity` (a prefix, the issue number and a short slug).
2. Use conventional commit messages, for example `fix: stop cow leaving the top of the screen`.
3. There is no automated test suite. Run `npm run build`, then `npm run check:assets`, which fails if an asset path written in the game code or in `index.html` is missing from the build. It cannot see paths assembled at runtime, so write asset paths as whole strings. Then `npm run preview` and play the game. Pull requests run the build and the asset check in CI.
4. Open a pull request against `main` and link the issue.

## License

A license file has not been added yet. Until it is, the code carries no open source license. Tracked in [#8](https://github.com/jadedm/feed-the-cow/issues/8).

## Acknowledgments

- Made for World Milk Day.
- Built on the Phaser 2 game framework.
- Virtual gamepad plugin by [Shawn Hymel](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad).

---

Built by [Manish Jadhav](https://manishj.com). Need something like this designed or built? [Inoltro](https://inoltro.ai) is my studio.
