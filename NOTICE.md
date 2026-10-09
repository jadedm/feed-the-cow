# Licensing notes

The MIT license in `LICENSE` covers the source code in this repository, and the cow and field art drawn in code (listed below). Third-party code keeps its own license.

## Not covered: game art, audio and brand

These are not licensed under MIT. All rights are reserved by their owners:

- the audio in `src/audio/`
- the screenshots in `screenshots/`
- the woohoo name and logo, and the woohoo campaign text, wherever they appear, including the title, description and social tags in `index.html`

You may not reuse, redistribute or modify them outside this repository without permission. To publish a fork of the game, replace the audio, screenshots and woohoo text with your own.

## Covered by MIT: art drawn in code

Every image in `src/images/` except `gamepad_spritesheet.png` is rendered from the SVG sources in `art/`, which `art/build-art.mjs` draws in code (`art/README.md` lists them). They are part of this project and covered by the MIT license with the code. Their lettering is set in Quicksand, which is under the SIL Open Font License.

`src/images/gamepad_spritesheet.png` is not reserved either: it is byte-identical to the joystick graphic distributed with the Phaser Virtual Gamepad plugin, and is covered by that plugin's license, below.

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
