import './Boot.js';
import './Preloader.js';
import './StartMenu.js';
import './Game.js';

window.onload = function() {
	var game = new Phaser.Game(960, 540, Phaser.CANVAS, '');
	game.state.add('Boot', feedTheCow.Boot);
	game.state.add('Preloader', feedTheCow.Preloader);
	game.state.start('Boot');
	game.state.add('StartMenu', feedTheCow.StartMenu);
	game.state.add('Game', feedTheCow.Game);
};
