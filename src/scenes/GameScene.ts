import Phaser from 'phaser';
import {
  BEST_SCORE_KEY,
  BULLET_HEIGHT,
  BULLET_SPEED,
  BULLET_WIDTH,
  CAR_HEIGHT,
  CAR_WIDTH,
  DIFFICULTY_INTERVAL_MS,
  FIRE_RATE_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  HITBOX_SCALE,
  INITIAL_GAME_SPEED,
  INITIAL_SPAWN_INTERVAL,
  KILL_SCORE_BONUS,
  LANE_CHANGE_DURATION_MS,
  LANES_X,
  MAX_GAME_SPEED,
  MIN_SPAWN_INTERVAL,
  PLAYER_Y,
  SCENE_KEYS,
  SPEED_INCREMENT,
  SPAWN_INTERVAL_DECREMENT,
} from '../utils/Constants';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private roadTile!: Phaser.GameObjects.TileSprite;
  private leftScenery!: Phaser.GameObjects.TileSprite;
  private rightScenery!: Phaser.GameObjects.TileSprite;

  private scoreText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private muzzleFlash!: Phaser.GameObjects.Rectangle;

  private currentLane = 1;
  private isChangingLane = false;
  private isGameOver = false;
  private lastFireTime = 0;
  private kills = 0;
  private bonusScore = 0;

  private gameSpeed = INITIAL_GAME_SPEED;
  private spawnInterval = INITIAL_SPAWN_INTERVAL;
  private distance = 0;
  private score = 0;

  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyTimer!: Phaser.Time.TimerEvent;
  private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private swipeStartX = 0;
  private swipeStartY = 0;

  constructor() {
    super(SCENE_KEYS.game);
  }

  create(): void {
    this.resetState();
    this.createWorld();
    this.createPlayer();
    this.createEnemiesGroup();
    this.createBulletsGroup();
    this.createParticles();
    this.createHud();
    this.setupCollisions();
    this.setupInput();
    this.setupTimers();
  }

  override update(_time: number, delta: number): void {
    if (this.isGameOver) {
      return;
    }

    const dt = delta / 1000;
    this.distance += this.gameSpeed * dt;
    this.score = Math.floor(this.distance / 10) + this.bonusScore;
    this.muzzleFlash.setPosition(this.player.x, this.player.y - CAR_HEIGHT * 0.42);
    this.updateHud();
    this.scrollBackground(dt);
    this.recycleEnemies();
    this.recycleBullets();
  }

  private resetState(): void {
    this.currentLane = 1;
    this.isChangingLane = false;
    this.isGameOver = false;
    this.gameSpeed = INITIAL_GAME_SPEED;
    this.spawnInterval = INITIAL_SPAWN_INTERVAL;
    this.distance = 0;
    this.score = 0;
    this.kills = 0;
    this.bonusScore = 0;
    this.lastFireTime = 0;
  }

  private createWorld(): void {
    this.roadTile = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'road-tile')
      .setOrigin(0, 0)
      .setDepth(0);

    this.leftScenery = this.add
      .tileSprite(-10, 0, 90, GAME_HEIGHT, 'tree-left')
      .setOrigin(0, 0)
      .setAlpha(0.7)
      .setDepth(0);

    this.rightScenery = this.add
      .tileSprite(GAME_WIDTH - 70, 0, 90, GAME_HEIGHT, 'tree-right')
      .setOrigin(0, 0)
      .setAlpha(0.7)
      .setDepth(0);
  }

  private createPlayer(): void {
    const startX = LANES_X[this.currentLane] ?? GAME_WIDTH / 2;
    this.player = this.physics.add
      .image(startX, PLAYER_Y, 'player-car')
      .setDisplaySize(CAR_WIDTH, CAR_HEIGHT)
      .setDepth(5);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    this.fitHitbox(body);

    this.muzzleFlash = this.add
      .rectangle(this.player.x, this.player.y - CAR_HEIGHT * 0.42, 10, 10, 0x90e0ef, 0.9)
      .setDepth(6)
      .setVisible(false);
  }

  private createBulletsGroup(): void {
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 32,
      runChildUpdate: false,
    });
  }

  private createEnemiesGroup(): void {
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 24,
      runChildUpdate: false,
    });
  }

  private createParticles(): void {
    this.explosionEmitter = this.add.particles(0, 0, 'particle-spark', {
      speed: { min: 80, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 450,
      tint: [0xff6b35, 0xffd60a, 0xe63946, 0xffffff],
      emitting: false,
      blendMode: 'ADD',
    });
    this.explosionEmitter.setDepth(20);
  }

  private createHud(): void {
    const best = this.getBestScore();

    this.add
      .text(16, 16, `Best: ${best}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        color: '#a8dadc',
      })
      .setDepth(30);

    this.scoreText = this.add
      .text(GAME_WIDTH - 16, 16, 'Score: 0', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(30);

    this.killsText = this.add
      .text(GAME_WIDTH / 2, 42, 'Kills: 0', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        color: '#ffd60a',
      })
      .setOrigin(0.5, 0)
      .setDepth(30);

    this.speedText = this.add
      .text(GAME_WIDTH / 2, 16, 'Speed: 1', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        color: '#90e0ef',
      })
      .setOrigin(0.5, 0)
      .setDepth(30);

    this.flashOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0)
      .setDepth(25);
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, enemy) => {
        this.handleCollision(enemy as Phaser.Physics.Arcade.Image);
      },
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bullet, enemy) => {
        this.handleBulletHit(bullet as Phaser.Physics.Arcade.Image, enemy as Phaser.Physics.Arcade.Image);
      },
      undefined,
      this,
    );
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-LEFT', () => this.changeLane(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
    this.input.keyboard?.on('keydown-SPACE', () => this.shoot());
    this.input.keyboard?.on('keydown-UP', () => this.shoot());
    this.input.keyboard?.on('keydown-Z', () => this.shoot());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - this.swipeStartX;
      const dy = pointer.y - this.swipeStartY;

      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        this.changeLane(dx < 0 ? -1 : 1);
        return;
      }

      if (pointer.y < GAME_HEIGHT * 0.55) {
        this.shoot();
        return;
      }

      if (pointer.x < GAME_WIDTH / 2) {
        this.changeLane(-1);
      } else {
        this.changeLane(1);
      }
    });
  }

  private setupTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.difficultyTimer = this.time.addEvent({
      delay: DIFFICULTY_INTERVAL_MS,
      loop: true,
      callback: () => this.increaseDifficulty(),
    });
  }

  private changeLane(direction: -1 | 1): void {
    if (this.isGameOver || this.isChangingLane) {
      return;
    }

    const nextLane = this.currentLane + direction;
    if (nextLane < 0 || nextLane >= LANES_X.length) {
      return;
    }

    this.isChangingLane = true;
    this.currentLane = nextLane;
    const targetX = LANES_X[nextLane] ?? GAME_WIDTH / 2;

    this.tweens.add({
      targets: this.player,
      x: targetX,
      angle: direction * 8,
      duration: LANE_CHANGE_DURATION_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.syncPlayerBody();
      },
      onComplete: () => {
        this.player.setAngle(0);
        this.syncPlayerBody();
        this.isChangingLane = false;
      },
    });

    this.tweens.add({
      targets: this.player,
      y: PLAYER_Y - 4,
      duration: LANE_CHANGE_DURATION_MS / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private syncPlayerBody(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.reset(this.player.x, this.player.y);
    this.fitHitbox(body);
  }

  private fitHitbox(body: Phaser.Physics.Arcade.Body): void {
    const hitW = CAR_WIDTH * HITBOX_SCALE;
    const hitH = CAR_HEIGHT * HITBOX_SCALE;
    body.setSize(hitW, hitH);
    body.setOffset((CAR_WIDTH - hitW) / 2, (CAR_HEIGHT - hitH) / 2);
  }

  private shoot(): void {
    if (this.isGameOver) {
      return;
    }

    const now = this.time.now;
    if (now - this.lastFireTime < FIRE_RATE_MS) {
      return;
    }
    this.lastFireTime = now;

    const spawnY = this.player.y - CAR_HEIGHT * 0.45;
    const bullet = this.bullets.get(this.player.x, spawnY, 'bullet') as Phaser.Physics.Arcade.Image | false;
    if (!bullet) {
      return;
    }

    bullet
      .setActive(true)
      .setVisible(true)
      .setDisplaySize(BULLET_WIDTH, BULLET_HEIGHT)
      .setPosition(this.player.x, spawnY)
      .setDepth(6);

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    body.setVelocity(0, -BULLET_SPEED);
    body.setSize(BULLET_WIDTH * 0.75, BULLET_HEIGHT * 0.75);
    body.setOffset(
      (BULLET_WIDTH - BULLET_WIDTH * 0.75) / 2,
      (BULLET_HEIGHT - BULLET_HEIGHT * 0.75) / 2,
    );

    this.muzzleFlash.setPosition(this.player.x, spawnY + 6).setVisible(true).setAlpha(0.95).setScale(1);
    this.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 90,
      onComplete: () => {
        this.muzzleFlash.setVisible(false).setScale(1).setAlpha(0.95);
      },
    });
  }

  private despawnEnemy(enemy: Phaser.Physics.Arcade.Image): void {
    enemy.setActive(false);
    enemy.setVisible(false);
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    enemyBody.stop();
    enemyBody.enable = false;
  }

  private despawnBullet(bullet: Phaser.Physics.Arcade.Image): void {
    bullet.setActive(false);
    bullet.setVisible(false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }

  private handleBulletHit(bullet: Phaser.Physics.Arcade.Image, enemy: Phaser.Physics.Arcade.Image): void {
    if (this.isGameOver || !enemy.active || !bullet.active) {
      return;
    }

    this.despawnBullet(bullet);
    this.despawnEnemy(enemy);
    this.kills += 1;
    this.bonusScore += KILL_SCORE_BONUS;
    this.explosionEmitter.explode(12, enemy.x, enemy.y);
    this.updateHud();
  }

  private recycleBullets(): void {
    const children = this.bullets.getChildren() as Phaser.Physics.Arcade.Image[];
    for (const bullet of children) {
      if (!bullet.active) {
        continue;
      }
      if (bullet.y < -BULLET_HEIGHT) {
        this.despawnBullet(bullet);
      }
    }
  }

  private spawnEnemy(): void {
    if (this.isGameOver) {
      return;
    }

    const laneIndex = Phaser.Math.Between(0, LANES_X.length - 1);
    const laneX = LANES_X[laneIndex] ?? GAME_WIDTH / 2;
    const textureKey = `enemy-car-${Phaser.Math.Between(1, 4)}`;

    const enemy = this.enemies.get(laneX, -CAR_HEIGHT, textureKey) as Phaser.Physics.Arcade.Image | false;
    if (!enemy) {
      return;
    }

    enemy
      .setActive(true)
      .setVisible(true)
      .setDisplaySize(CAR_WIDTH, CAR_HEIGHT)
      .setPosition(laneX, -CAR_HEIGHT)
      .setDepth(4);

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    body.setVelocityY(this.gameSpeed);
    this.fitHitbox(body);
  }

  private recycleEnemies(): void {
    const children = this.enemies.getChildren() as Phaser.Physics.Arcade.Image[];
    for (const enemy of children) {
      if (!enemy.active) {
        continue;
      }
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(this.gameSpeed);
      if (enemy.y > GAME_HEIGHT + CAR_HEIGHT) {
        this.enemies.killAndHide(enemy);
        body.stop();
      }
    }
  }

  private increaseDifficulty(): void {
    this.gameSpeed = Math.min(MAX_GAME_SPEED, this.gameSpeed + SPEED_INCREMENT);
    this.spawnInterval = Math.max(MIN_SPAWN_INTERVAL, this.spawnInterval - SPAWN_INTERVAL_DECREMENT);
    this.spawnTimer.destroy();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
  }

  private scrollBackground(dt: number): void {
    this.roadTile.tilePositionY -= this.gameSpeed * dt;
    this.leftScenery.tilePositionY -= this.gameSpeed * dt * 0.45;
    this.rightScenery.tilePositionY -= this.gameSpeed * dt * 0.45;
  }

  private updateHud(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.killsText.setText(`Kills: ${this.kills}`);
    const speedLevel = Math.floor((this.gameSpeed - INITIAL_GAME_SPEED) / SPEED_INCREMENT) + 1;
    this.speedText.setText(`Speed: ${speedLevel}`);
  }

  private handleCollision(enemy: Phaser.Physics.Arcade.Image): void {
    if (this.isGameOver) {
      return;
    }

    this.isGameOver = true;
    this.spawnTimer.destroy();
    this.difficultyTimer.destroy();

    this.explosionEmitter.explode(30, this.player.x, this.player.y);
    this.despawnEnemy(enemy);

    this.flashOverlay.setAlpha(0.45);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
    });

    this.cameras.main.shake(180, 0.01);

    this.time.delayedCall(700, () => {
      this.scene.start(SCENE_KEYS.gameOver, { score: this.score });
    });
  }

  private getBestScore(): number {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
