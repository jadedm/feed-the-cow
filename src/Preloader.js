window.feedTheCow.Preloader = function (game) {
  this.preloadBar = null;
  this.titleText = null;
  this.ready = false;
};

window.feedTheCow.Preloader.prototype = {
  preload: function () {
    this.preloadBar = this.add.sprite(
      this.world.centerX,
      this.world.centerY + 80,
      "preloadBar"
    );
    this.preloadBar.anchor.setTo(0.5, 0.5);
    this.load.setPreloadSprite(this.preloadBar);
    this.titleText = this.add.image(
      this.world.centerX,
      this.world.centerY - 80,
      "titleimage"
    );
    this.titleText.anchor.setTo(0.5, 0.5);
    this.load.image("titlescreen", "src/images/title.png");
    this.load.image("bg", "src/images/BG.png");
    this.load.spritesheet("cow", "src/images/cow.png", 186, 94);
    this.load.image("grass", "src/images/grass.png");
    this.load.image("injection", "src/images/injection.png");
    this.load.image("deadCow", "src/images/deadcow.png");
    this.load.spritesheet("button", "src/images/try-again.png", 143, 48);
    this.load.spritesheet(
      "gamepad",
      "src/images/gamepad_spritesheet.png",
      100,
      100
    );
    this.load.audio("hurt", "src/audio/hurt.wav");
    this.load.audio("select_audio", "src/audio/select.mp3");
    this.load.audio("game_audio", "src/audio/bg.mp3");
  },

  create: function () {
    this.preloadBar.cropEnabled = false; //force show the whole thing
  },

  update: function () {
    if (this.cache.isSoundDecoded("game_audio") && !this.ready) {
      this.ready = true;
      this.state.start("StartMenu");
    }
  },
};
