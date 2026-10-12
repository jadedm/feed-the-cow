window.feedTheCow.Boot = function (game) {};

window.feedTheCow.Boot.prototype = {
  init: function () {
    // Hidden in main.js until the first layout has centred it (#43).
    this.game.canvas.style.visibility = "";
  },

  preload: function () {
    this.load.image("preloadBar", "src/images/loader_bar.png");
    this.load.image("titleimage", "src/images/TitleImage.png");
  },

  create: function () {
    this.input.maxPointers = 1;
    this.stage.disableVisibilityChange = false;
    this.input.addPointer();
    this.stage.backgroundColor = "#F8DD52";

    this.state.start("Preloader");
  },
};
