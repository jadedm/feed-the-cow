# Cow and field art

The running cow, the hit cow, the favicon cow and the field background are drawn in code. They are covered by the MIT license with the rest of the code (see `NOTICE.md`).

| Source | Rendered to | Size |
| --- | --- | --- |
| `cow-run.svg` | `src/images/cow-run.png` | 960x100, six 160x100 frames |
| `cow-hit.svg` | `src/images/cow-hit.png` | 160x100 |
| `cow-icon.svg` | `src/images/cow-icon.png` | 64x64 |
| `field.svg` | `src/images/field.png` | 960x540, repeats left to right |

## Changing the art

1. Edit `build-art.mjs` and run `node art/build-art.mjs`. It rewrites the four SVG files.
2. Render each SVG to its PNG at the exact size above, with a transparent background for the cow files. Any browser works: open the SVG and export or screenshot it. With Playwright, `page.locator("svg").screenshot({ path, omitBackground: true })` on a page containing the SVG does it.
3. Run `npm run build` and play the game in `npm run preview`.

The frame size and count are also set where the game loads the sprite sheet, in `src/Preloader.js`. The collision box is set in `buildCow` in `src/Game.js`; keep it over the torso and head if the drawing changes.

The field repeats as the game scrolls it: anything drawn near the left or right edge is drawn again one tile width away, so there is no seam.
