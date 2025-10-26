feedTheCow.StartMenu = function(game) {
	this.startBG;
	this.startPrompt;
	this.ding;
};

feedTheCow.StartMenu.prototype = {
	
	create: function () {
		this.ding = this.add.audio('select_audio');
		startBG = this.add.image(0, 0, 'titlescreen');
		startBG.inputEnabled = true;
		startBG.events.onInputDown.addOnce(this.startGame, this);
		
		//startPrompt = this.add.text(this.world.centerX-120, this.world.centerY+150, 'touch to start', { fontSize: '32px', fill: '#000',font:'Quicksand', fontWeight:'bold' });
		//startPrompt = this.add.bitmapText(this.world.centerX-155, this.world.centerY+100, 'font', 'Touch to Start!', 24);
	},

	startGame: function (pointer) {
		this.ding.play();
		this.state.start('Game');
	}
};