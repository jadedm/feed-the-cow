import "./src/Boot.js";
import "./src/Preloader.js";
import "./src/StartMenu.js";
import "./src/Game.js";

// Phaser lays the canvas out on its first frame, before any state runs, and
// then only on a throttled check (200 ms later, backing off to 2 s). Setting scaling and centring here,
// right after boot, makes that first layout the final one; the canvas stays
// hidden until Boot starts, which is after that layout (#43).
function layOutBeforeFirstFrame(game) {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.setMinMax(480, 260, 960, 540);
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.canvas.style.visibility = "hidden";
}

window.onload = function () {
  var game = new Phaser.Game(960, 540, Phaser.CANVAS, "");
  // Boot happens inside the constructor when the device is already ready, or
  // later otherwise; either way it comes before the first frame.
  if (game.isBooted) layOutBeforeFirstFrame(game);
  else game.onBoot.addOnce(layOutBeforeFirstFrame);
  game.state.add("Boot", feedTheCow.Boot);
  game.state.add("Preloader", feedTheCow.Preloader);
  game.state.start("Boot");
  game.state.add("StartMenu", feedTheCow.StartMenu);
  game.state.add("Game", feedTheCow.Game);
};
