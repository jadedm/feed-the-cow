window.feedTheCow.Game = function(game) {

	this.background = null;
	this.cow = null;
	this.grassGroup = null;
	this.totalGrass = 0;
	this.injectionGroup = null;
	this.totalInjection = 0;
	this.gameOver = false;
	this.overMessage = null;
	this.overMessageNew = null;
	this.overMessageCenter = null;
	this.secondsElapsed = 0;
	this.timer = null;
	this.music = null;
	this.ouch = null;
	this.ding = null;
	this.score = 0;
	this.scoreText = null;
};

// Game constants
window.feedTheCow.Game.SCORE_INCREMENT = 10;
window.feedTheCow.Game.TOTAL_GRASS = 3;
window.feedTheCow.Game.TOTAL_INJECTIONS = 3;

// Spawn position constants
window.feedTheCow.Game.SPAWN_X_MIN = 960;
window.feedTheCow.Game.SPAWN_X_MAX = 2500;
window.feedTheCow.Game.SPAWN_Y_MIN = 0;
window.feedTheCow.Game.SPAWN_Y_MAX_GRASS = 530;
window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION = 500;

// Velocity constants
window.feedTheCow.Game.GRASS_VELOCITY_MIN = -150;
window.feedTheCow.Game.GRASS_VELOCITY_MAX = -200;
window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MIN = -200;
window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MAX = -400;
window.feedTheCow.Game.INJECTION_VELOCITY_MIN = -200;
window.feedTheCow.Game.INJECTION_VELOCITY_MAX = -250;
window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MIN = -400;
window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MAX = -450;

// Difficulty progression - seconds elapsed to scroll speed mapping
window.feedTheCow.Game.SCROLL_SPEEDS = [
	{ threshold: 40, speed: 11 },
	{ threshold: 35, speed: 10 },
	{ threshold: 30, speed: 9 },
	{ threshold: 25, speed: 8 },
	{ threshold: 20, speed: 7 },
	{ threshold: 15, speed: 6 },
	{ threshold: 10, speed: 5 },
	{ threshold: 5, speed: 4 },
	{ threshold: 0, speed: 3 }
];

window.feedTheCow.Game.prototype = {
	

	create: function() {
		this.gameOver = false;
		this.secondsElapsed = 0;
		this.score = 0;
		this.timer = this.time.create(false);
		this.timer.loop(1000, this.updateSeconds, this);
		this.totalGrass = window.feedTheCow.Game.TOTAL_GRASS;
		this.totalInjection = window.feedTheCow.Game.TOTAL_INJECTIONS;

		this.music = this.add.audio('game_audio');
        this.music.play('', 0, 0.3, true);
        this.ouch = this.add.audio('hurt');
        this.ding = this.add.audio('select_audio');

		this.buildWorld();

	    /*The score*/
		this.scoreText = this.add.text(15, 15, 'score: 0', { fontSize: '28px', fill: '#000',font:'Quicksand' });
	      	    
	},

	updateSeconds: function(){
		this.secondsElapsed += 1;
	},

	getScrollSpeed: function() {
		var speeds = window.feedTheCow.Game.SCROLL_SPEEDS;
		for (var i = 0; i < speeds.length; i++) {
			if (this.secondsElapsed > speeds[i].threshold) {
				return speeds[i].speed;
			}
		}
		return speeds[speeds.length - 1].speed;
	},

	buildWorld: function(){
		this.background = this.add.tileSprite(0, 0, 960, 540, 'bg');
		this.physics.startSystem(Phaser.Physics.ARCADE);
		this.buildCow();
		this.buildGrass();
		this.buildInjection();
		this.timer.start(); 

	},

	buildCow: function(){
		this.cow = this.add.sprite(0, this.world.height - 300, 'cow');
		this.cow.inputEnabled = true;
		this.physics.arcade.enable(this.cow);
		this.cow.body.collideWorldBounds = true;
		//  This allows you to drag the sprite. The parameter controls if you drag from the position you touched it (false)
	    //  or if it will snap to the center (true)
	    this.cow.input.enableDrag();
	    //  This will lock the sprite so it can only be dragged vertically, not horizontally
	    this.cow.input.allowHorizontalDrag = false;
	},

	buildGrass: function(){
		this.grassGroup = this.add.group();
	    for (var i = 0; i < this.totalGrass ; i++)
	    {
	        var g = this.grassGroup.create(
	        	this.rnd.integerInRange(window.feedTheCow.Game.SPAWN_X_MIN, window.feedTheCow.Game.SPAWN_X_MAX),
	        	this.rnd.realInRange(window.feedTheCow.Game.SPAWN_Y_MIN, window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION),
	        	'grass', ''
	        );
	        this.physics.enable(g, Phaser.Physics.ARCADE);
	        g.enableBody = true;
	        g.body.velocity.x = this.rnd.integerInRange(window.feedTheCow.Game.GRASS_VELOCITY_MIN, window.feedTheCow.Game.GRASS_VELOCITY_MAX);
	        g.checkWorldBounds = true;
	        g.events.onOutOfBounds.add(this.resetGrass, this);
	    }
	},

	resetGrass: function(g){
		if(g.y > 0){
			this.respawnGrass(g);
		}
	},

	respawnGrass: function(g){
		if (!this.gameOver) {
			g.reset(
				this.rnd.integerInRange(window.feedTheCow.Game.SPAWN_X_MIN, window.feedTheCow.Game.SPAWN_X_MAX),
				this.rnd.realInRange(window.feedTheCow.Game.SPAWN_Y_MIN, window.feedTheCow.Game.SPAWN_Y_MAX_GRASS)
			);
        	g.body.velocity.x = this.rnd.integerInRange(window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MIN, window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MAX);
		}
	},

	buildInjection: function(){
		this.injectionGroup = this.add.group();
	    for (var i = 0; i < this.totalInjection ; i++)
	    {
	        var j = this.injectionGroup.create(
	        	this.rnd.integerInRange(window.feedTheCow.Game.SPAWN_X_MIN, window.feedTheCow.Game.SPAWN_X_MAX),
	        	this.rnd.realInRange(window.feedTheCow.Game.SPAWN_Y_MIN, window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION),
	        	'injection', ''
	        );
	        this.physics.enable(j, Phaser.Physics.ARCADE);
	        j.enableBody = true;
	        j.body.velocity.x = this.rnd.integerInRange(window.feedTheCow.Game.INJECTION_VELOCITY_MIN, window.feedTheCow.Game.INJECTION_VELOCITY_MAX);
	        j.checkWorldBounds = true;
	        j.events.onOutOfBounds.add(this.resetInjection, this);
	    }
	},

	resetInjection: function(j){
		if(j.y > 0){
			this.respawnInjection(j);
		}
	},

	respawnInjection: function(j){
		if (!this.gameOver) {
			j.reset(
				this.rnd.integerInRange(window.feedTheCow.Game.SPAWN_X_MIN, window.feedTheCow.Game.SPAWN_X_MAX),
				this.rnd.realInRange(window.feedTheCow.Game.SPAWN_Y_MIN, window.feedTheCow.Game.SPAWN_Y_MAX_GRASS)
			);
	        j.body.velocity.x = this.rnd.integerInRange(window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MIN, window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MAX);
		}
	},

	collectGrass: function(cow, g) {
		if(cow.exists){
			g.kill();
			this.respawnGrass(g);			
		}
			

	    /*
			Add and update the score
		*/
		this.score += window.feedTheCow.Game.SCORE_INCREMENT;
    	this.scoreText.text = 'Score: ' + this.score;

	},

	injectCow: function(cow,j){
		cow.kill();
		this.ouch.play();
		this.animateCow(cow);
		this.music.stop();
		this.gameOver = true;
		this.overMessage = this.add.button(this.world.centerX-100, this.world.centerY-80, 'button');
		this.overMessageNew = this.add.text(this.world.centerX-100, this.world.centerY ,"come on! \n", { fontSize: '30px', fill: '#000',font:'Quicksand' });
		this.overMessageCenter = this.add.text(this.world.centerX-220, this.world.centerY+40,"she's just getting started!", { fontSize: '30px', fill: '#000',font:'Quicksand' });
		this.overMessage.inputEnabled = true;
        this.overMessage.events.onInputDown.addOnce(this.quitGame, this);
	},

	quitGame:function(pointer) {
		this.ding.play();
        this.state.start('StartMenu');
    },

	animateCow: function(cow){
		var cowDead = this.add.sprite(cow.x+200, cow.y, 'deadCow');
		this.physics.enable(cowDead,Phaser.Physics.ARCADE);
		cowDead.enableBody = true;
		cowDead.checkWorldBounds = true;
		cowDead.body.velocity.x = 10;
		cowDead.body.velocity.y = 80;
		cowDead.angle += 120;
	},


	update: function() {
		this.physics.arcade.overlap(this.cow, this.grassGroup, this.collectGrass, null, this);
		this.physics.arcade.overlap(this.cow, this.injectionGroup, this.injectCow, null, this);

		if (!this.gameOver) {
			this.background.tilePosition.x -= this.getScrollSpeed();
		}

	},

	shutdown: function() {
		// Stop and destroy timer
		if (this.timer) {
			this.timer.stop();
			this.timer.destroy();
			this.timer = null;
		}

		// Stop and destroy audio
		if (this.music) {
			this.music.stop();
			this.music.destroy();
			this.music = null;
		}
		if (this.ouch) {
			this.ouch.destroy();
			this.ouch = null;
		}
		if (this.ding) {
			this.ding.destroy();
			this.ding = null;
		}

		// Clean up groups
		if (this.grassGroup) {
			this.grassGroup.forEach(function(grass) {
				grass.events.onOutOfBounds.removeAll();
			}, this);
			this.grassGroup.destroy();
			this.grassGroup = null;
		}
		if (this.injectionGroup) {
			this.injectionGroup.forEach(function(injection) {
				injection.events.onOutOfBounds.removeAll();
			}, this);
			this.injectionGroup.destroy();
			this.injectionGroup = null;
		}

		// Clean up sprites
		if (this.cow) {
			this.cow = null;
		}
		if (this.background) {
			this.background = null;
		}
		if (this.scoreText) {
			this.scoreText = null;
		}

		// Clean up game over UI elements
		if (this.overMessage) {
			this.overMessage = null;
		}
		if (this.overMessageNew) {
			this.overMessageNew = null;
		}
		if (this.overMessageCenter) {
			this.overMessageCenter = null;
		}
	}



};
