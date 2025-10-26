feedTheCow.Game = function(game) {
	
	this.background;
	this.cow;
	this.grassGroup;
	this.totalGrass;
	this.injectionGroup;
	this.totalInjection;
	this.gameOver;
	this.overMessage;
	this.overMessageNew;
	this.overMessageCenter;
	this.secondsElapsed;
	this.timer;
	this.music;
	this.collect;
	this.ouch;
	this.ding;
	//this.button;
};


var score = 0;

feedTheCow.Game.prototype = {
	

	create: function() {
		this.gameOver = false;
		this.secondsElapsed = 0;
		this.timer = this.time.create(false);
		this.timer.loop(1000, this.updateSeconds, this);
		this.totalGrass = 3;
		this.totalInjection = 3;

		this.music = this.add.audio('game_audio');
        this.music.play('', 0, 0.3, true);
        this.ouch = this.add.audio('hurt');
        this.ding = this.add.audio('select_audio');

		this.buildWorld();

	    /*The score*/
		scoreText = this.add.text(15, 15, 'score: 0', { fontSize: '28px', fill: '#000',font:'Quicksand' });
	      	    
	},

	updateSeconds: function(){
		this.secondsElapsed += 1;
	},

	buildWorld: function(){
		background = this.add.tileSprite(0, 0, 960, 540, 'bg');
		this.physics.startSystem(Phaser.Physics.ARCADE);
		this.buildCow();
		this.buildGrass();
		this.buildInjection();
		this.timer.start(); 

	},

	buildCow: function(){
		cow = this.add.sprite(0, this.world.height - 300, 'cow');
		cow.inputEnabled = true;
		this.physics.arcade.enable(cow);
		cow.body.collideWorldBounds = true;
		//  This allows you to drag the sprite. The parameter controls if you drag from the position you touched it (false)
	    //  or if it will snap to the center (true)
	    cow.input.enableDrag();
	    //  This will lock the sprite so it can only be dragged vertically, not horizontally
	    cow.input.allowHorizontalDrag = false;
	},

	buildGrass: function(){
		this.grassGroup = this.add.group();
	    //  Here we'll create 2 of them evenly spaced apart
	    for (var i = 0; i < this.totalGrass ; i++)
	    {	
	    	//comment this section
	        var g = this.grassGroup.create(this.rnd.integerInRange(2500, this.world.height), this.rnd.realInRange(0,500), 'grass', '');
	        this.physics.enable(g, Phaser.Physics.ARCADE);
	        g.enableBody = true;
	        g.body.velocity.x = this.rnd.integerInRange(-150, -200);
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
		if(this.gameOver == false){
			g.reset(this.rnd.integerInRange(2500, this.world.height), this.rnd.realInRange(0,530));
        	g.body.velocity.x = this.rnd.integerInRange(-200, -400);
		}
	},

	/**/

	buildInjection: function(){
		this.injectionGroup = this.add.group();
	    //  Here we'll create 2 of them evenly spaced apart
	    for (var i = 0; i < this.totalInjection ; i++)
	    {	
	    	//comment this section
	        var j = this.injectionGroup.create(this.rnd.integerInRange(1000, this.world.height), this.rnd.realInRange(0,500), 'injection', '');
	        this.physics.enable(j, Phaser.Physics.ARCADE);
	        j.enableBody = true;
	        j.body.velocity.x = this.rnd.integerInRange(-200, -250);
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
		if(this.gameOver == false){
			j.reset(this.rnd.integerInRange(1000, this.world.height), this.rnd.realInRange(0,530));
	        j.body.velocity.x = this.rnd.integerInRange(-400, -450);
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
		score += 10;
    	scoreText.text = 'Score: ' + score;

	},

	injectCow: function(cow,j){
		cow.kill();
		this.ouch.play();
		this.animateCow(cow);
		this.music.stop();
		this.gameOver = true;
		//button = this.add.button(this.world.centerX - 100, 400, 'button', );
		this.overMessage = this.add.button(this.world.centerX-100, this.world.centerY-80, 'button');
		this.overMessageNew = this.add.text(this.world.centerX-100, this.world.centerY ,"come on! \n", { fontSize: '30px', fill: '#000',font:'Quicksand' });
		this.overMessageCenter = this.add.text(this.world.centerX-220, this.world.centerY+40,"she's just getting started!", { fontSize: '30px', fill: '#000',font:'Quicksand' });
		this.overMessage.inputEnabled = true;
        this.overMessage.events.onInputDown.addOnce(this.quitGame, this);
        score = 0;
	},

	quitGame:function(pointer) {
		this.ding.play();
        this.state.start('StartMenu');
    },

	animateCow: function(cow){
		cowDead = this.add.sprite(cow.x+200, cow.y, 'deadCow');
		this.physics.enable(cowDead,Phaser.Physics.ARCADE);
		cowDead.enableBody = true;
		cowDead.checkWorldBounds = true;
		cowDead.body.velocity.x = 10;
		cowDead.body.velocity.y = 80;
		cowDead.angle += 120;
	},


	update: function() {
		//this.physics.arcade.overlap(cow, grass, this.collectGrass, null, this);
		this.physics.arcade.overlap(cow, this.grassGroup, this.collectGrass, null, this);
		this.physics.arcade.overlap(cow, this.injectionGroup, this.injectCow, null, this);
		
		if (this.gameOver == false && this.secondsElapsed > 5) {
			background.tilePosition.x -= 4;
		}

		if (this.gameOver == false && this.secondsElapsed > 10) {
			background.tilePosition.x -= 5;
		}

		if (this.gameOver == false && this.secondsElapsed > 15) {		
			background.tilePosition.x -= 6;
		}

		if (this.gameOver == false && this.secondsElapsed > 20) {
			background.tilePosition.x -= 7;
		}

		if (this.gameOver == false && this.secondsElapsed > 25) {
			background.tilePosition.x -= 8;
		}

		if (this.gameOver == false && this.secondsElapsed > 30) {
			background.tilePosition.x -= 9;
		}

		if (this.gameOver == false && this.secondsElapsed > 35) {
			background.tilePosition.x -= 10;
		}

		if (this.gameOver == false && this.secondsElapsed > 40) {
			background.tilePosition.x -= 11;
		}		

		if(this.gameOver == false){
			background.tilePosition.x -= 3;			
		}

	},


	
};
