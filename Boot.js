window.feedTheCow.Boot = function(game) {};

window.feedTheCow.Boot.prototype = {
	
	preload: function() {
		this.load.image('preloadBar','images/loader_bar.png');
		this.load.image('titleimage','images/TitleImage.png');

	},

	create: function() {

		this.input.maxPointers = 1;
        this.stage.disableVisibilityChange = false;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.setMinMax(480, 260, 960, 540);
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
		this.input.addPointer();
		this.stage.backgroundColor = '#F8DD52';

		this.state.start('Preloader');

	},
	
};