window.feedTheCow.StartMenu = function(game) {
	this.startBG = null;
	this.ding = null;
};

window.feedTheCow.StartMenu.prototype = {
	
	create: function () {
		this.ding = this.add.audio('select_audio');
		this.startBG = this.add.image(0, 0, 'titlescreen');
		this.startBG.inputEnabled = true;
		this.startBG.events.onInputDown.addOnce(this.startGame, this);
	},

	startGame: function (pointer) {
		this.ding.play();
		this.state.start('Game');
	}
};