/**
 * Game state constructor
 * Initializes all game properties and state variables
 * @param {Phaser.Game} game - The Phaser game instance
 */
window.feedTheCow.Game = function (game) {
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
  this.lastInjectionSpawnTime = 0;
  this.cursors = null;
  this.gamepad = null;
  this.joystick = null;
};

/**
 * Score increment per grass collected
 */
window.feedTheCow.Game.SCORE_INCREMENT = 10;

/**
 * Total number of grass items in the game
 */
window.feedTheCow.Game.TOTAL_GRASS = 5;

/**
 * Initial number of injections at game start
 */
window.feedTheCow.Game.TOTAL_INJECTIONS_START = 2;

/**
 * Minimum X position for spawning game objects
 */
window.feedTheCow.Game.SPAWN_X_MIN = 960;

/**
 * Maximum X position for spawning game objects
 */
window.feedTheCow.Game.SPAWN_X_MAX = 2500;

/**
 * Minimum Y position for spawning game objects
 */
window.feedTheCow.Game.SPAWN_Y_MIN = 0;

/**
 * Maximum Y position for spawning grass
 */
window.feedTheCow.Game.SPAWN_Y_MAX_GRASS = 530;

/**
 * Maximum Y position for spawning injections
 */
window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION = 500;

/**
 * Minimum velocity for grass (initial spawn)
 */
window.feedTheCow.Game.GRASS_VELOCITY_MIN = -150;

/**
 * Maximum velocity for grass (initial spawn)
 */
window.feedTheCow.Game.GRASS_VELOCITY_MAX = -200;

/**
 * Minimum velocity for grass (respawn)
 */
window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MIN = -200;

/**
 * Maximum velocity for grass (respawn)
 */
window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MAX = -400;

/**
 * Minimum velocity for injections (initial spawn)
 */
window.feedTheCow.Game.INJECTION_VELOCITY_MIN = -200;

/**
 * Maximum velocity for injections (initial spawn)
 */
window.feedTheCow.Game.INJECTION_VELOCITY_MAX = -250;

/**
 * Minimum velocity for injections (respawn)
 */
window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MIN = -400;

/**
 * Maximum velocity for injections (respawn)
 */
window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MAX = -450;

/**
 * Base scroll speed for background
 */
window.feedTheCow.Game.SCROLL_SPEED_BASE = 3;

/**
 * Speed multiplier per second (square root scaled)
 */
window.feedTheCow.Game.SCROLL_SPEED_MULTIPLIER = 0.5;

/**
 * Cow movement speed in pixels per second
 */
window.feedTheCow.Game.COW_SPEED = 300;

/**
 * Progressive injection spawning configuration
 * Adds more injections over time at specific thresholds
 * Matrix swarm effect at 50 seconds
 */
window.feedTheCow.Game.INJECTION_PROGRESSION = [
  { threshold: 50, injectionsToAdd: 8 },
  { threshold: 45, injectionsToAdd: 5 },
  { threshold: 40, injectionsToAdd: 3 },
  { threshold: 30, injectionsToAdd: 2 },
  { threshold: 20, injectionsToAdd: 2 },
  { threshold: 10, injectionsToAdd: 1 },
];

window.feedTheCow.Game.prototype = {
  /**
   * Create function called when state starts
   * Initializes all game objects, audio, and UI elements
   */
  create: function () {
    this.gameOver = false;
    this.secondsElapsed = 0;
    this.score = 0;
    this.lastInjectionSpawnTime = 0;
    this.timer = this.time.create(false);
    this.timer.loop(1000, this.updateSeconds, this);
    this.totalGrass = window.feedTheCow.Game.TOTAL_GRASS;
    this.totalInjection = window.feedTheCow.Game.TOTAL_INJECTIONS_START;

    this.music = this.add.audio("game_audio");
    this.music.play("", 0, 0.3, true);
    this.ouch = this.add.audio("hurt");
    this.ding = this.add.audio("select_audio");

    this.cursors = this.input.keyboard.createCursorKeys();

    this.buildWorld();

    this.scoreText = this.add.text(15, 15, "score: 0", {
      fontSize: "28px",
      fill: "#000",
      font: "Quicksand",
    });

    this.gamepad = this.game.plugins.add(Phaser.Plugin.VirtualGamepad);
    this.joystick = this.gamepad.addJoystick(860, 450, 1.0, "gamepad");
  },

  /**
   * Updates the seconds elapsed counter
   * Called every second by the timer
   */
  updateSeconds: function () {
    this.secondsElapsed += 1;
    this.checkInjectionProgression();
  },

  /**
   * Checks if new injections should be spawned based on elapsed time
   * Implements progressive difficulty by adding more obstacles
   */
  checkInjectionProgression: function () {
    var progression = window.feedTheCow.Game.INJECTION_PROGRESSION;
    for (var i = 0; i < progression.length; i++) {
      if (
        this.secondsElapsed === progression[i].threshold &&
        this.lastInjectionSpawnTime < progression[i].threshold
      ) {
        this.spawnAdditionalInjections(progression[i].injectionsToAdd);
        this.lastInjectionSpawnTime = progression[i].threshold;
        break;
      }
    }
  },

  /**
   * Spawns additional injections during gameplay
   * @param {number} count - Number of injections to spawn
   */
  spawnAdditionalInjections: function (count) {
    if (!this.injectionGroup || this.gameOver) return;

    for (var i = 0; i < count; i++) {
      var j = this.injectionGroup.create(
        this.rnd.integerInRange(
          window.feedTheCow.Game.SPAWN_X_MIN,
          window.feedTheCow.Game.SPAWN_X_MAX
        ),
        this.rnd.realInRange(
          window.feedTheCow.Game.SPAWN_Y_MIN,
          window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION
        ),
        "injection",
        ""
      );
      this.physics.enable(j, Phaser.Physics.ARCADE);
      j.enableBody = true;
      j.body.velocity.x = this.rnd.integerInRange(
        window.feedTheCow.Game.INJECTION_VELOCITY_MIN,
        window.feedTheCow.Game.INJECTION_VELOCITY_MAX
      );
      j.checkWorldBounds = true;
      j.events.onOutOfBounds.add(this.resetInjection, this);

      this.totalInjection++;
    }
  },

  /**
   * Calculates current scroll speed based on elapsed time
   * Uses square root scaling for smooth continuous increase
   * Prevents game from becoming instantly impossible
   * Speed progression: 0s: 3, 16s: ~5, 36s: ~6, 64s: ~7, 100s: ~8
   * @returns {number} Current scroll speed in pixels per frame
   */
  getScrollSpeed: function () {
    var baseSpeed = window.feedTheCow.Game.SCROLL_SPEED_BASE;
    var multiplier = window.feedTheCow.Game.SCROLL_SPEED_MULTIPLIER;

    var speed = baseSpeed + Math.sqrt(this.secondsElapsed) * multiplier;

    return speed;
  },

  /**
   * Builds the game world
   * Creates background, physics system, and all game entities
   */
  buildWorld: function () {
    this.background = this.add.tileSprite(0, 0, 960, 540, "bg");
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.buildCow();
    this.buildGrass();
    this.buildInjection();
    this.timer.start();
  },

  /**
   * Creates and configures the cow sprite
   * Enables drag controls for vertical movement only
   */
  buildCow: function () {
    this.cow = this.add.sprite(0, this.world.height - 300, "cow");
    this.cow.inputEnabled = true;
    this.physics.arcade.enable(this.cow);
    this.cow.body.collideWorldBounds = true;
    this.cow.input.enableDrag();
    this.cow.input.allowHorizontalDrag = false;
  },

  /**
   * Creates the initial grass group
   * Spreads grass apart with random spacing to prevent clustering
   */
  buildGrass: function () {
    this.grassGroup = this.add.group();
    for (var i = 0; i < this.totalGrass; i++) {
      var baseOffset = i * 400;
      var randomOffset = this.rnd.integerInRange(0, 600);
      var g = this.grassGroup.create(
        window.feedTheCow.Game.SPAWN_X_MIN + baseOffset + randomOffset,
        this.rnd.realInRange(
          window.feedTheCow.Game.SPAWN_Y_MIN,
          window.feedTheCow.Game.SPAWN_Y_MAX_GRASS
        ),
        "grass",
        ""
      );
      this.physics.enable(g, Phaser.Physics.ARCADE);
      g.enableBody = true;
      g.body.velocity.x = this.rnd.integerInRange(
        window.feedTheCow.Game.GRASS_VELOCITY_MIN,
        window.feedTheCow.Game.GRASS_VELOCITY_MAX
      );
      g.checkWorldBounds = true;
      g.events.onOutOfBounds.add(this.resetGrass, this);
    }
  },

  /**
   * Handles grass going out of bounds
   * @param {Phaser.Sprite} g - The grass sprite that went out of bounds
   */
  resetGrass: function (g) {
    if (g.y > 0) {
      this.respawnGrass(g);
    }
  },

  /**
   * Respawns grass at a new position
   * Uses wider spawn range with controlled randomness to prevent clustering
   * @param {Phaser.Sprite} g - The grass sprite to respawn
   */
  respawnGrass: function (g) {
    if (!this.gameOver) {
      var spawnX = this.rnd.integerInRange(
        window.feedTheCow.Game.SPAWN_X_MIN,
        window.feedTheCow.Game.SPAWN_X_MAX + 500
      );
      g.reset(
        spawnX,
        this.rnd.realInRange(
          window.feedTheCow.Game.SPAWN_Y_MIN,
          window.feedTheCow.Game.SPAWN_Y_MAX_GRASS
        )
      );
      g.body.velocity.x = this.rnd.integerInRange(
        window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MIN,
        window.feedTheCow.Game.GRASS_RESPAWN_VELOCITY_MAX
      );
    }
  },

  /**
   * Creates the initial injection group
   */
  buildInjection: function () {
    this.injectionGroup = this.add.group();
    for (var i = 0; i < this.totalInjection; i++) {
      var j = this.injectionGroup.create(
        this.rnd.integerInRange(
          window.feedTheCow.Game.SPAWN_X_MIN,
          window.feedTheCow.Game.SPAWN_X_MAX
        ),
        this.rnd.realInRange(
          window.feedTheCow.Game.SPAWN_Y_MIN,
          window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION
        ),
        "injection",
        ""
      );
      this.physics.enable(j, Phaser.Physics.ARCADE);
      j.enableBody = true;
      j.body.velocity.x = this.rnd.integerInRange(
        window.feedTheCow.Game.INJECTION_VELOCITY_MIN,
        window.feedTheCow.Game.INJECTION_VELOCITY_MAX
      );
      j.checkWorldBounds = true;
      j.events.onOutOfBounds.add(this.resetInjection, this);
    }
  },

  /**
   * Handles injection going out of bounds
   * @param {Phaser.Sprite} j - The injection sprite that went out of bounds
   */
  resetInjection: function (j) {
    if (j.y > 0) {
      this.respawnInjection(j);
    }
  },

  /**
   * Respawns injection at a new position
   * @param {Phaser.Sprite} j - The injection sprite to respawn
   */
  respawnInjection: function (j) {
    if (!this.gameOver) {
      j.reset(
        this.rnd.integerInRange(
          window.feedTheCow.Game.SPAWN_X_MIN,
          window.feedTheCow.Game.SPAWN_X_MAX
        ),
        this.rnd.realInRange(
          window.feedTheCow.Game.SPAWN_Y_MIN,
          window.feedTheCow.Game.SPAWN_Y_MAX_GRASS
        )
      );
      j.body.velocity.x = this.rnd.integerInRange(
        window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MIN,
        window.feedTheCow.Game.INJECTION_RESPAWN_VELOCITY_MAX
      );
    }
  },

  /**
   * Handles collision between cow and grass
   * Respawns grass immediately and updates score
   * @param {Phaser.Sprite} cow - The cow sprite
   * @param {Phaser.Sprite} g - The grass sprite that was collected
   */
  collectGrass: function (cow, g) {
    if (cow.exists) {
      this.respawnGrass(g);
    }

    this.score += window.feedTheCow.Game.SCORE_INCREMENT;
    this.scoreText.text = "Score: " + this.score;
  },

  /**
   * Handles collision between cow and injection
   * Triggers game over sequence
   * @param {Phaser.Sprite} cow - The cow sprite
   * @param {Phaser.Sprite} j - The injection sprite that hit the cow
   */
  injectCow: function (cow, j) {
    cow.kill();
    this.ouch.play();
    this.animateCow(cow);
    this.music.stop();
    this.gameOver = true;
    this.overMessage = this.add.button(
      this.world.centerX - 100,
      this.world.centerY - 80,
      "button"
    );
    this.overMessageNew = this.add.text(
      this.world.centerX - 100,
      this.world.centerY,
      "come on! \n",
      { fontSize: "30px", fill: "#000", font: "Quicksand" }
    );
    this.overMessageCenter = this.add.text(
      this.world.centerX - 220,
      this.world.centerY + 40,
      "she's just getting started!",
      { fontSize: "30px", fill: "#000", font: "Quicksand" }
    );
    this.overMessage.inputEnabled = true;
    this.overMessage.events.onInputDown.addOnce(this.quitGame, this);
  },

  /**
   * Handles quit game button press
   * Returns to start menu
   * @param {Phaser.Pointer} pointer - The pointer that triggered the event
   */
  quitGame: function (pointer) {
    this.ding.play();
    this.state.start("StartMenu");
  },

  /**
   * Creates death animation for the cow
   * Spawns a dead cow sprite with rotation and velocity
   * @param {Phaser.Sprite} cow - The original cow sprite
   */
  animateCow: function (cow) {
    var cowDead = this.add.sprite(cow.x + 200, cow.y, "deadCow");
    this.physics.enable(cowDead, Phaser.Physics.ARCADE);
    cowDead.enableBody = true;
    cowDead.checkWorldBounds = true;
    cowDead.body.velocity.x = 10;
    cowDead.body.velocity.y = 80;
    cowDead.angle += 120;
  },

  /**
   * Main game loop update function
   * Handles collision detection and player input
   */
  update: function () {
    this.physics.arcade.overlap(
      this.cow,
      this.grassGroup,
      this.collectGrass,
      null,
      this
    );
    this.physics.arcade.overlap(
      this.cow,
      this.injectionGroup,
      this.injectCow,
      null,
      this
    );

    if (!this.gameOver) {
      if (this.joystick.properties.inUse) {
        this.cow.body.velocity.y =
          (this.joystick.properties.y / 100) *
          window.feedTheCow.Game.COW_SPEED;
      } else if (this.cursors.up.isDown) {
        this.cow.body.velocity.y = -window.feedTheCow.Game.COW_SPEED;
      } else if (this.cursors.down.isDown) {
        this.cow.body.velocity.y = window.feedTheCow.Game.COW_SPEED;
      } else {
        this.cow.body.velocity.y = 0;
      }

      this.background.tilePosition.x -= this.getScrollSpeed();
    }
  },

  /**
   * Cleanup function called when state shuts down
   * Destroys all game objects and removes event listeners
   */
  shutdown: function () {
    if (this.timer) {
      this.timer.stop();
      this.timer.destroy();
      this.timer = null;
    }

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

    if (this.grassGroup) {
      this.grassGroup.forEach(function (grass) {
        grass.events.onOutOfBounds.removeAll();
      }, this);
      this.grassGroup.destroy();
      this.grassGroup = null;
    }
    if (this.injectionGroup) {
      this.injectionGroup.forEach(function (injection) {
        injection.events.onOutOfBounds.removeAll();
      }, this);
      this.injectionGroup.destroy();
      this.injectionGroup = null;
    }

    if (this.cow) {
      this.cow = null;
    }
    if (this.background) {
      this.background = null;
    }
    if (this.scoreText) {
      this.scoreText = null;
    }

    if (this.overMessage) {
      this.overMessage = null;
    }
    if (this.overMessageNew) {
      this.overMessageNew = null;
    }
    if (this.overMessageCenter) {
      this.overMessageCenter = null;
    }
  },
};
