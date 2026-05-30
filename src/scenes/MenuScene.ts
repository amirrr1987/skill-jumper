import Phaser from 'phaser';
import {
  BEST_SCORE_KEY,
  CAR_HEIGHT,
  CAR_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  LANES_X,
  SCENE_KEYS,
} from '../utils/Constants';

interface BackgroundCar {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

export class MenuScene extends Phaser.Scene {
  private backgroundCars: BackgroundCar[] = [];
  private promptText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.setupInput();
    this.spawnBackgroundCar();
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.spawnBackgroundCar(),
    });
  }

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    for (let i = this.backgroundCars.length - 1; i >= 0; i -= 1) {
      const car = this.backgroundCars[i];
      if (!car) {
        continue;
      }
      car.sprite.y += car.speed * dt;
      if (car.sprite.y > GAME_HEIGHT + CAR_HEIGHT) {
        car.sprite.destroy();
        this.backgroundCars.splice(i, 1);
      }
    }
  }

  private createBackground(): void {
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'road-tile').setOrigin(0, 0).setAlpha(0.85);
    this.add.tileSprite(-10, 0, 90, GAME_HEIGHT, 'tree-left').setOrigin(0, 0).setAlpha(0.55);
    this.add
      .tileSprite(GAME_WIDTH - 70, 0, 90, GAME_HEIGHT, 'tree-right')
      .setOrigin(0, 0)
      .setAlpha(0.55);
  }

  private createTitle(): void {
    const best = this.getBestScore();

    this.add
      .text(16, 20, `Best: ${best}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        color: '#a8dadc',
      })
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, 'Skill Jumper', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '42px',
        color: '#48cae4',
        fontStyle: 'bold',
        stroke: '#023e8a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 'Endless Car Dodge', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '20px',
        color: '#caf0f8',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.promptText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 'Tap to Start', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#0096c744',
        padding: { x: 28, y: 16 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupInput(): void {
    const startGame = (): void => {
      this.scene.start(SCENE_KEYS.game);
    };

    this.promptText.on('pointerup', startGame);
    this.input.keyboard?.on('keydown-SPACE', startGame);
    this.input.keyboard?.on('keydown-ENTER', startGame);
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > GAME_HEIGHT * 0.55) {
        startGame();
      }
    });
  }

  private spawnBackgroundCar(): void {
    const laneIndex = Phaser.Math.Between(0, LANES_X.length - 1);
    const laneX = LANES_X[laneIndex] ?? GAME_WIDTH / 2;
    const textureKey = `enemy-car-${Phaser.Math.Between(1, 4)}`;
    const sprite = this.add
      .image(laneX, -CAR_HEIGHT, textureKey)
      .setDisplaySize(CAR_WIDTH, CAR_HEIGHT)
      .setAlpha(0.65)
      .setDepth(1);

    this.backgroundCars.push({
      sprite,
      speed: Phaser.Math.Between(180, 280),
    });
  }

  private getBestScore(): number {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
