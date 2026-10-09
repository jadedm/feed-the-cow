# Game art

Every image the game draws, apart from the joystick graphic that comes with the gamepad plugin, is drawn in code by `build-art.mjs`. It is covered by the MIT license with the rest of the code (see `NOTICE.md`).

| Source | Rendered to | Size | Background |
| --- | --- | --- | --- |
| `title.svg` | `src/images/title.png` | 960x540 | opaque |
| `loading.svg` | `src/images/TitleImage.png` | 425x223 | transparent |
| `loader-bar.svg` | `src/images/loader_bar.png` | 291x21 | transparent |
| `cow-run.svg` | `src/images/cow-run.png` | 1280x100, eight 160x100 frames | transparent |
| `cow-hit.svg` | `src/images/cow-hit.png` | 160x100 | transparent |
| `cow-icon.svg` | `src/images/cow-icon.png` | 64x64 | transparent |
| `field.svg` | `src/images/field.png` | 960x540, repeats left to right | opaque |
| `grass.svg` | `src/images/grass.png` | 60x30 | transparent |
| `injection.svg` | `src/images/injection.png` | 60x13 | transparent |
| `try-again.svg` | `src/images/try-again.png` | 143x48 | transparent |

The sizes are fixed: collision boxes, item spacing and the tests depend on them.

## Changing the art

1. Edit `build-art.mjs` and run `node art/build-art.mjs`. It rewrites every SVG listed above.
2. Run `node art/render-art.mjs` to render every SVG to its PNG at the size above, or name the SVGs that changed (`node art/render-art.mjs grass.svg`). It renders in Playwright's Chromium with Quicksand (SIL Open Font License) loaded from Google Fonts, and exits non-zero if the font does not load or a PNG comes out at the wrong size. A different Chromium can shift anti-aliasing at the edges, so commit only the PNGs whose SVGs changed.
3. Run `npm run test:e2e` and play the game in `npm run preview`.

The frame size and count are also set where the game loads the sprite sheet, in `src/Preloader.js`. The collision box is set in `buildCow` in `src/Game.js`; keep it over the torso and head if the drawing changes.

The field repeats as the game scrolls it: anything drawn near the left or right edge is drawn again one tile width away, so there is no seam.
