# Licensing notes

Everything in this repository is covered by the MIT license in `LICENSE`, except the third-party code listed below, which keeps its own license, and the Quicksand font, which is under the SIL Open Font License. That includes the game art and sound, which are made in code, and the screenshots, which are taken from the game.

## Art drawn in code

Every image in `src/images/` except `gamepad_spritesheet.png` is rendered from the SVG sources in `art/`, which `art/build-art.mjs` draws in code (`art/README.md` lists them). Their lettering is set in Quicksand.

`src/images/gamepad_spritesheet.png` is byte-identical to the joystick graphic distributed with the Phaser Virtual Gamepad plugin, and is covered by that plugin's license, below.

## Sound made in code

The music and sound effects in `src/audio/` are synthesised by `scripts/build-audio.mjs`.

## Screenshots

The images in `screenshots/` are taken from the built game by `scripts/take-screenshots.mjs`.

## Quicksand

The page loads Quicksand from Google Fonts, and the lettering in the art is rendered with it. Quicksand is by Andrew Paglinawan and is licensed under the SIL Open Font License 1.1. No font files are stored in this repository.

## Third-party code

| Path | Project | License |
| --- | --- | --- |
| `src/libs/phaser.js`, `src/libs/phaser.min.js`, `src/libs/phaser.map` | Phaser CE v2.20.2, Copyright 2017 Richard Davey, Photon Storm Ltd. | MIT |
| bundled inside Phaser | pixi.js v2 (Phaser's fork), Copyright 2013-2015 Mathew Groves | MIT |
| bundled inside Phaser | p2.js, Copyright 2015 p2.js authors | MIT |
| bundled inside Phaser | PolyK, Copyright 2012 Ivan Kuckir | MIT |
| bundled inside Phaser | gl-matrix, Copyright 2013 Brandon Jones and Colin MacKenzie IV | BSD 2-clause style |
| `src/libs/plugins/phaser-plugin-virtual-gamepad.js`, `src/images/gamepad_spritesheet.png` | Phaser Virtual Gamepad, Copyright 2016 Shawn Hymel, joystick math based on work by Eugenio Fage | MIT |

The game ships the minified `src/libs/phaser.min.js`, which carries no license text for Phaser or the libraries bundled in it. `src/libs/THIRD-PARTY-LICENSES.txt` reproduces all five and is published next to it. The plugin in this repo is patched to run with a joystick and no button.
