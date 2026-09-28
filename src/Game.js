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
  this.score = 0;
  this.scoreText = null;
  this.lastInjectionSpawnTime = 0;
  this.cursors = null;
  this.wasd = null;
  this.dragPointer = null;
  this.dragGrab = null;
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
 * Grass speed over the ground, in pixels per second. Every grass moves at
 * the ground's current speed plus this, so it always travels left faster
 * than the background, and two grass never catch up with each other.
 */
window.feedTheCow.Game.GRASS_SPEED = 120;

/**
 * Injection speed over the ground, in pixels per second. One speed for all
 * injections, so two injections never catch up with each other.
 */
window.feedTheCow.Game.INJECTION_SPEED = 245;

/**
 * Minimum clear space around every grass and injection, in pixels, when it
 * spawns.
 */
window.feedTheCow.Game.ITEM_GAP = 20;

/**
 * Random spots a spawn tries before it is placed behind the rightmost item.
 */
window.feedTheCow.Game.SPAWN_TRIES = 12;

/**
 * Base scroll speed for background, in pixels per 1/60 s
 * (see GROUND_SPEED_SCALE)
 */
window.feedTheCow.Game.SCROLL_SPEED_BASE = 3;

/**
 * Speed multiplier per second (square root scaled)
 */
window.feedTheCow.Game.SCROLL_SPEED_MULTIPLIER = 0.5;

/**
 * The scroll speed constants are in pixels per 1/60 s. Multiply by this for
 * pixels per second. It is a fixed unit, not the frame rate: Phaser CE runs one
 * update per display frame, so nothing here depends on how often update runs.
 */
window.feedTheCow.Game.GROUND_SPEED_SCALE = 60;

/**
 * The cow's top speed in pixels per second, in any direction
 */
window.feedTheCow.Game.COW_TOP_SPEED = 450;

/**
 * How quickly the cow's speed eases toward what the player asks for, in
 * seconds: after this long it has closed about 63% of the gap, after three
 * times this about 95%. Smaller is snappier; it never jumps in one frame.
 */
window.feedTheCow.Game.COW_RESPONSE_TIME = 0.08;

/**
 * The cow's right edge stops here, not at the edge of the field. Injections
 * appear at x = 960 moving about 425 px/s, so this leaves about half a
 * second to see one coming, and keeps the cow clear of the joystick.
 */
window.feedTheCow.Game.COW_FIELD_RIGHT = 720;

/**
 * Frames per second of the cow's run animation (8 frames in cow-run.png)
 */
window.feedTheCow.Game.COW_RUN_FPS = 14;

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

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.KeyCode.W,
      down: Phaser.KeyCode.S,
      left: Phaser.KeyCode.A,
      right: Phaser.KeyCode.D,
    });
    this.dragPointer = null;
    this.dragGrab = null;

    this.buildWorld();

    this.scoreText = this.add.text(15, 15, "score: " + this.score, {
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
      var j = this.injectionGroup.create(0, 0, "injection", "");
      this.physics.enable(j, Phaser.Physics.ARCADE);
      this.placeClear(
        j,
        window.feedTheCow.Game.SPAWN_X_MIN,
        window.feedTheCow.Game.SPAWN_X_MAX,
        window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION
      );

      this.totalInjection++;
    }
  },

  /**
   * Calculates current scroll speed based on elapsed time
   * Uses square root scaling for smooth continuous increase
   * Prevents game from becoming instantly impossible
   * Speed progression: 0s: 3, 16s: ~5, 36s: ~6, 64s: ~7, 100s: ~8
   * @returns {number} Current scroll speed in pixels per 1/60 s
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
   * Creates and configures the cow sprite.
   * Pressing on the cow starts a drag: the cow then eases toward the pointer
   * (see desiredCowVelocity) instead of jumping to it.
   */
  buildCow: function () {
    this.cow = this.add.sprite(40, this.world.centerY - 50, "cow");
    this.cow.animations.add("run");
    this.cow.animations.play("run", window.feedTheCow.Game.COW_RUN_FPS, true);
    this.cow.inputEnabled = true;
    this.physics.arcade.enable(this.cow);
    // Torso and head only, so a swinging leg or the tail neither gets hit by
    // an injection nor collects grass.
    this.cow.body.setSize(120, 62, 32, 12);
    this.cow.body.collideWorldBounds = true;
    this.keepWholeCowInField();

    this.cow.events.onInputDown.add(this.startDrag, this);
    this.input.onUp.add(this.endDrag, this);
  },

  /**
   * World-bounds collision works on the collision box, which is smaller than
   * the drawing, so legs and horns could leave the field. Shrink the physics
   * bounds by the box's margins inside the sprite so the whole sprite stays in,
   * and stop at COW_FIELD_RIGHT on the right.
   */
  keepWholeCowInField: function () {
    var body = this.cow.body;
    var left = body.offset.x;
    var top = body.offset.y;
    var right = this.cow.width - body.offset.x - body.width;
    var bottom = this.cow.height - body.offset.y - body.height;
    var fieldRight = window.feedTheCow.Game.COW_FIELD_RIGHT;
    this.physics.arcade.setBounds(
      left,
      top,
      fieldRight - left - right,
      this.world.height - top - bottom
    );
  },

  /**
   * Starts dragging the cow with the pointer that pressed it, remembering
   * where on the cow it was grabbed.
   * @param {Phaser.Sprite} cow - The cow sprite
   * @param {Phaser.Pointer} pointer - The pointer that pressed it
   */
  startDrag: function (cow, pointer) {
    if (this.joystick.properties.inUse) return;
    this.dragPointer = pointer;
    this.dragGrab = { x: pointer.worldX - cow.x, y: pointer.worldY - cow.y };
  },

  /**
   * Ends a drag when the dragging pointer is released.
   * @param {Phaser.Pointer} pointer - The pointer that was released
   */
  endDrag: function (pointer) {
    if (pointer !== this.dragPointer) return;
    this.dragPointer = null;
    this.dragGrab = null;
  },

  /**
   * The velocity the player is asking for, in pixels per second, capped at
   * COW_TOP_SPEED. The joystick wins over a drag, which wins over the keys.
   * @returns {{x: number, y: number}}
   */
  desiredCowVelocity: function () {
    var top = window.feedTheCow.Game.COW_TOP_SPEED;
    var stick = this.joystick.properties;
    if (stick.inUse) {
      return { x: (stick.x / 100) * top, y: (stick.y / 100) * top };
    }
    if (this.dragPointer) return this.dragVelocity(top);
    return this.keyVelocity(top);
  },

  /**
   * Toward the drag point, at a speed proportional to the distance left and
   * capped at top speed, so the cow slows as it arrives. The proportion is
   * 1 / (4 x COW_RESPONSE_TIME): with the eased velocity in moveCow, that is
   * critically damped, so the cow settles on the point without overshooting.
   * @param {number} top - Top speed in pixels per second
   * @returns {{x: number, y: number}}
   */
  dragVelocity: function (top) {
    var dx = this.dragPointer.worldX - this.dragGrab.x - this.cow.x;
    var dy = this.dragPointer.worldY - this.dragGrab.y - this.cow.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.5) return { x: 0, y: 0 };

    var perSecond = 1 / (4 * window.feedTheCow.Game.COW_RESPONSE_TIME);
    var speed = Math.min(top, distance * perSecond);
    return { x: (dx / distance) * speed, y: (dy / distance) * speed };
  },

  /**
   * Arrow keys and WASD, with diagonals no faster than a single direction.
   * @param {number} top - Top speed in pixels per second
   * @returns {{x: number, y: number}}
   */
  keyVelocity: function (top) {
    var keys = [this.cursors, this.wasd];
    var held = function (direction) {
      return keys.some(function (set) {
        return set[direction].isDown;
      });
    };
    var x = (held("right") ? 1 : 0) - (held("left") ? 1 : 0);
    var y = (held("down") ? 1 : 0) - (held("up") ? 1 : 0);
    var length = Math.sqrt(x * x + y * y) || 1;
    return { x: (x / length) * top, y: (y / length) * top };
  },

  /**
   * Eases the cow's velocity toward what the player asks for: each frame it
   * closes the share of the gap that COW_RESPONSE_TIME allows for that frame's
   * length, so it speeds up and slows down smoothly and behaves the same at
   * any display rate.
   */
  moveCow: function () {
    var desired = this.desiredCowVelocity();
    var velocity = this.cow.body.velocity;
    var seconds = this.time.delta / 1000;
    var response = window.feedTheCow.Game.COW_RESPONSE_TIME;
    var share = 1 - Math.exp(-seconds / response);
    velocity.x += (desired.x - velocity.x) * share;
    velocity.y += (desired.y - velocity.y) * share;
  },

  /**
   * Creates the initial grass group
   * Spreads grass apart with random spacing to prevent clustering
   */
  buildGrass: function () {
    this.grassGroup = this.add.group();
    for (var i = 0; i < this.totalGrass; i++) {
      var xMin = window.feedTheCow.Game.SPAWN_X_MIN + i * 400;
      var g = this.grassGroup.create(0, 0, "grass", "");
      this.physics.enable(g, Phaser.Physics.ARCADE);
      this.placeClear(
        g,
        xMin,
        xMin + 600,
        window.feedTheCow.Game.SPAWN_Y_MAX_GRASS
      );
    }
  },

  /**
   * Moves grass and injections at the ground's current speed plus their kind's,
   * and respawns any that have scrolled fully past the left edge.
   * Respawn comes first because reset() zeroes the velocity.
   * Items spawn off-screen to the right, so Phaser's checkWorldBounds cannot
   * be used here: it fires for any sprite outside the world, including ones
   * still on their way in, and reset() re-arms it every frame.
   */
  updateItems: function () {
    var ground =
      this.getScrollSpeed() * window.feedTheCow.Game.GROUND_SPEED_SCALE;

    this.grassGroup.forEachAlive(function (g) {
      if (g.x + g.width < 0) this.respawnGrass(g);
      g.body.velocity.x = -(ground + window.feedTheCow.Game.GRASS_SPEED);
    }, this);
    this.injectionGroup.forEachAlive(function (j) {
      if (j.x + j.width < 0) this.respawnInjection(j);
      j.body.velocity.x = -(ground + window.feedTheCow.Game.INJECTION_SPEED);
    }, this);
  },

  /**
   * Every live grass and injection except the given one.
   * @param {Phaser.Sprite} item - The item to leave out
   * @returns {Phaser.Sprite[]}
   */
  otherItems: function (item) {
    var others = [];
    [this.grassGroup, this.injectionGroup].forEach(function (group) {
      if (!group) return;
      group.forEachAlive(function (other) {
        if (other !== item) others.push(other);
      });
    });
    return others;
  },

  /**
   * Whether two items are closer than ITEM_GAP on both axes.
   * @param {Phaser.Sprite} a
   * @param {Phaser.Sprite} b
   * @returns {boolean}
   */
  tooClose: function (a, b) {
    var gap = window.feedTheCow.Game.ITEM_GAP;
    return (
      a.x < b.x + b.width + gap &&
      b.x < a.x + a.width + gap &&
      a.y < b.y + b.height + gap &&
      b.y < a.y + a.height + gap
    );
  },

  /**
   * Moves an item to a random spot with ITEM_GAP of room around it. If none
   * of SPAWN_TRIES spots is clear, places it just behind the rightmost item,
   * which is always clear.
   * @param {Phaser.Sprite} item - The item to place
   * @param {number} xMin - Leftmost spawn x
   * @param {number} xMax - Rightmost spawn x for a random spot
   * @param {number} yMax - Lowest spawn y
   */
  placeClear: function (item, xMin, xMax, yMax) {
    var gap = window.feedTheCow.Game.ITEM_GAP;
    var yMin = window.feedTheCow.Game.SPAWN_Y_MIN;
    var others = this.otherItems(item);
    var clashes = function (other) {
      return this.tooClose(item, other);
    }.bind(this);

    for (var i = 0; i < window.feedTheCow.Game.SPAWN_TRIES; i++) {
      item.reset(
        this.rnd.integerInRange(xMin, xMax),
        this.rnd.realInRange(yMin, yMax)
      );
      if (!others.some(clashes)) return;
    }

    var rightEdge = others.reduce(function (edge, other) {
      return Math.max(edge, other.x + other.width);
    }, xMin - gap);
    item.reset(rightEdge + gap, this.rnd.realInRange(yMin, yMax));
  },

  /**
   * Respawns grass at a clear spot off-screen to the right
   * @param {Phaser.Sprite} g - The grass sprite to respawn
   */
  respawnGrass: function (g) {
    if (this.gameOver) return;

    this.placeClear(
      g,
      window.feedTheCow.Game.SPAWN_X_MIN,
      window.feedTheCow.Game.SPAWN_X_MAX + 500,
      window.feedTheCow.Game.SPAWN_Y_MAX_GRASS
    );
  },

  /**
   * Creates the initial injection group
   */
  buildInjection: function () {
    this.injectionGroup = this.add.group();
    for (var i = 0; i < this.totalInjection; i++) {
      var j = this.injectionGroup.create(0, 0, "injection", "");
      this.physics.enable(j, Phaser.Physics.ARCADE);
      this.placeClear(
        j,
        window.feedTheCow.Game.SPAWN_X_MIN,
        window.feedTheCow.Game.SPAWN_X_MAX,
        window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION
      );
    }
  },

  /**
   * Respawns an injection at a clear spot off-screen to the right
   * @param {Phaser.Sprite} j - The injection sprite to respawn
   */
  respawnInjection: function (j) {
    if (this.gameOver) return;

    this.placeClear(
      j,
      window.feedTheCow.Game.SPAWN_X_MIN,
      window.feedTheCow.Game.SPAWN_X_MAX,
      window.feedTheCow.Game.SPAWN_Y_MAX_INJECTION
    );
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
    this.scoreText.text = "score: " + this.score;
  },

  /**
   * Handles collision between cow and injection
   * Triggers game over sequence
   * @param {Phaser.Sprite} cow - The cow sprite
   * @param {Phaser.Sprite} j - The injection sprite that hit the cow
   */
  injectCow: function (cow, j) {
    // Arcade overlap keeps calling back for every injection touching the cow
    // in the same frame, even after the first one killed it.
    if (this.gameOver) return;

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
    window.feedTheCow.selectSound.play();
    this.state.start("StartMenu");
  },

  /**
   * Creates death animation for the cow
   * Spawns the hit cow sprite, drifting down and slightly right
   * @param {Phaser.Sprite} cow - The original cow sprite
   */
  animateCow: function (cow) {
    // cow-hit.png is drawn already tipped over, so it is not rotated.
    var cowDead = this.add.sprite(cow.x, cow.y, "deadCow");
    this.physics.enable(cowDead, Phaser.Physics.ARCADE);
    cowDead.body.velocity.x = 10;
    cowDead.body.velocity.y = 80;
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
      this.moveCow();

      // Phaser CE updates once per display frame and moves bodies by the real
      // frame time (time.delta, ms), so the ground must scroll by it too, or it
      // runs twice as fast on a 120 Hz screen.
      var groundPxPerSec =
        this.getScrollSpeed() * window.feedTheCow.Game.GROUND_SPEED_SCALE;
      var groundStep = (groundPxPerSec * this.time.delta) / 1000;
      this.background.tilePosition.x -= groundStep;
      this.updateItems();
    }
  },

  /**
   * Cleanup function called when state shuts down
   * Stops the timer and music, destroys sounds and groups, and removes the
   * gamepad plugin
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

    // The state change also resets input signals; removing it here keeps
    // shutdown's cleanup complete on its own.
    this.input.onUp.remove(this.endDrag, this);
    this.dragPointer = null;
    this.dragGrab = null;

    // Plugins belong to the game, not the state, so each run would add another.
    if (this.gamepad) {
      this.game.plugins.remove(this.gamepad);
      this.gamepad = null;
      this.joystick = null;
    }

    if (this.grassGroup) {
      this.grassGroup.destroy();
      this.grassGroup = null;
    }
    if (this.injectionGroup) {
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
