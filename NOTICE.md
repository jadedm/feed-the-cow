# Licensing notes

The MIT license in `LICENSE` covers the source code in this repository, and the cow and field art drawn in code (listed below). Third-party code keeps its own license.

## Not covered: game art, audio and brand

These are not licensed under MIT. All rights are reserved by their owners:

- the images in `src/images/`, except the ones listed under "Covered by MIT" below, and the audio in `src/audio/`
- the screenshots in `screenshots/`
- the woohoo name and logo, and the woohoo campaign text, wherever they appear, including the title, description and social tags in `index.html`

You may not reuse, redistribute or modify them outside this repository without permission. To publish a fork of the game, replace the art, audio, screenshots and woohoo text with your own.

## Covered by MIT: art drawn in code

`src/images/cow-run.png`, `src/images/cow-hit.png`, `src/images/cow-icon.png` and `src/images/field.png` are rendered from the SVG sources in `art/`, which `art/build-art.mjs` draws in code. They are part of this project and covered by the MIT license with the code.

`src/images/gamepad_spritesheet.png` is not reserved either: it is byte-identical to the joystick graphic distributed with the Phaser Virtual Gamepad plugin, and is covered by that plugin's license, below.

## Third-party code

| Path | Project | License |
| --- | --- | --- |
| `src/libs/phaser.js`, `src/libs/phaser.min.js`, `src/libs/phaser.map` | Phaser v2.4.8, Copyright 2016 Photon Storm Ltd. | MIT |
| bundled inside `phaser.js` | p2.js, Copyright 2015 p2.js authors | MIT |
| bundled inside `phaser.js` | PolyK, Copyright 2012 Ivan Kuckir | MIT |
| bundled inside `phaser.js` | gl-matrix, Copyright 2013 Brandon Jones and Colin MacKenzie IV | BSD 2-clause style |
| `src/libs/plugins/phaser-plugin-virtual-gamepad.js`, `src/images/gamepad_spritesheet.png` | Phaser Virtual Gamepad, Copyright 2016 Shawn Hymel, joystick math based on work by Eugenio Fage | MIT |

The full license text for each is kept in the header of the file that contains it. The plugin in this repo is patched to run with a joystick and no button.
