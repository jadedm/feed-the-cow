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

- Scroll speed keeps rising for as long as you survive, following a square-root curve.
- Injection count climbs from 2 to 23 over the first 50 seconds.
- Three ways to control the cow: drag with mouse or touch, arrow keys, or an on-screen joystick on mobile.
- Runs in desktop and mobile browsers, scaled to fit the screen.
- Sound effects and background music.

## Controls

| Input | Action |
| --- | --- |
| Mouse or touch | Drag the cow up or down |
| Arrow keys | Up and down move the cow |
| Virtual joystick | Touch and drag, bottom right of the screen |

## How to play

1. Move the cow up and down to eat the green grass.
2. Each grass eaten scores 10 points.
3. Avoid the injections. One hit ends the game.
4. The game speeds up and adds injections over time. Survive as long as you can.

## Getting started

### Prerequisites

- Node.js 18 or later (required by Vite 5)
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

Phaser loads images and sounds at runtime from paths such as `src/images/BG.png`. Vite cannot see those paths, so `vite build` does not copy the assets. Copy `src/` into `dist/` yourself after building:

```bash
npm run build
cp -r src dist/
npm run preview
```

`npm run deploy` does the build and the copy, then publishes `dist/` to the `gh-pages` branch.

## Tech stack

- Game engine: [Phaser 2](https://phaser.io/). This is Phaser 2, not Phaser 3; the APIs differ.
- Build tool: [Vite](https://vitejs.dev/)
- Language: JavaScript (ES modules)
- Mobile controls: [Phaser Virtual Gamepad](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad), patched to run with a joystick and no button

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
├── index.html
├── main.js             # Creates the Phaser game and registers the states
├── vite.config.js
├── jsdoc.json
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

It has no upper limit.

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
3. There is no automated test suite. Build, copy assets and run `npm run preview`, then play the game to check your change.
4. Open a pull request against `main` and link the issue.

## License

A license file has not been added yet. Until it is, the code carries no open source license. Tracked in [#4](https://github.com/jadedm/feed-the-cow/issues/4).

## Acknowledgments

- Made for World Milk Day.
- Built on the Phaser 2 game framework.
- Virtual gamepad plugin by [Shawn Hymel](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad).

---

Built by [Manish Jadhav](https://manishj.com). Need something like this designed or built? [Inoltro](https://inoltro.ai) is my studio.
