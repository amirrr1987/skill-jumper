import Phaser from 'phaser';
import { BEST_SCORE_KEY, GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../utils/Constants';

interface GameOverData {
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  private finalScore = 0;

  constructor() {
    super(SCENE_KEYS.gameOver);
  }

  init(data: GameOverData | undefined): void {
    this.finalScore = data?.score ?? 0;
  }

  create(): void {
    const score = this.finalScore;
    const previousBest = this.getBestScore();
    const best = Math.max(previousBest, score);
    localStorage.setItem(BEST_SCORE_KEY, String(best));

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, 'Game Over', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '44px',
        color: '#e63946',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, `Score: ${score}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '30px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, `Best: ${best}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        color: score >= best ? '#ffd60a' : '#a8dadc',
      })
      .setOrigin(0.5);

    const restartButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, 'Tap to Restart', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#0096c766',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: restartButton,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const restart = (): void => {
      this.scene.start(SCENE_KEYS.game);
    };

    restartButton.on('pointerup', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.on('pointerup', restart);
  }

  private getBestScore(): number {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
