# Licensing notes

The MIT license in `LICENSE` covers the source code in this repository.

## Not covered: game art, audio and brand

The images in `src/images/` and the audio in `src/audio/`, and the woohoo name and logo that appear in them, are not licensed under MIT. All rights are reserved by their owners. You may not reuse, redistribute or modify them outside this repository without permission.

To publish a fork of the game, replace these files with your own.

One exception: `src/images/gamepad_spritesheet.png` is the joystick graphic from the Phaser Virtual Gamepad plugin and is covered by that plugin's license, below.

## Third-party code

| Path | Project | License |
| --- | --- | --- |
| `src/libs/phaser.js`, `src/libs/phaser.min.js`, `src/libs/phaser.map` | Phaser 2, Copyright 2016 Photon Storm Ltd. | MIT |
| `src/libs/plugins/phaser-plugin-virtual-gamepad.js`, `src/images/gamepad_spritesheet.png` | Phaser Virtual Gamepad, Copyright 2016 Shawn Hymel | MIT (stated in the plugin source header) |

The plugin in this repo is patched to run with a joystick and no button.
