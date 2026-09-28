window.feedTheCow.StartMenu = function (game) {
  this.startBG = null;
};

window.feedTheCow.StartMenu.prototype = {
  create: function () {
    this.startBG = this.add.image(0, 0, "titlescreen");
    this.startBG.inputEnabled = true;
    this.startBG.events.onInputDown.addOnce(this.startGame, this);
  },

  startGame: function (pointer) {
    window.feedTheCow.selectSound.play();
    this.state.start("Game");
  },
};
