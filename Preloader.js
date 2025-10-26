window.feedTheCow.Preloader = function(game) {
	this.preloadBar = null;
	this.titleText = null;
	this.ready = false;
};

window.feedTheCow.Preloader.prototype = {
	
	preload: function () {		
		this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY+80, 'preloadBar');
		this.preloadBar.anchor.setTo(0.5, 0.5);
		this.load.setPreloadSprite(this.preloadBar);
		this.titleText = this.add.image(this.world.centerX, this.world.centerY-80, 'titleimage');
		this.titleText.anchor.setTo(0.5, 0.5);
		this.load.image('titlescreen', 'images/title.png');
		this.load.image('bg', 'images/BG.png' );
		this.load.spritesheet('cow', 'images/cow.png', 186, 94);
		this.load.image('grass', 'images/grass.png');
		this.load.image('injection', 'images/injection.png');
		this.load.image('deadCow', 'images/deadcow.png');
		this.load.spritesheet('button', 'images/try-again.png', 143, 48);
		this.load.audio('hurt', 'audio/hurt.wav');
		this.load.audio('select_audio', 'audio/select.mp3');
		this.load.audio('game_audio', 'audio/bg.mp3');
	},

	create: function () {
		this.preloadBar.cropEnabled = false; //force show the whole thing
	},

	update: function () {
		if(this.cache.isSoundDecoded('game_audio') && !this.ready) {
		   	this.ready = true;
		   	this.state.start('StartMenu');
		}

	}
};