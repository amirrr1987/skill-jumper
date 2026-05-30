import Phaser from 'phaser';
import {
  drawEnemyCar,
  drawParticleSpark,
  drawPlayerCar,
  drawRoadTile,
  drawTreeLeft,
  drawTreeRight,
} from '../utils/CarDrawer';
import { SCENE_KEYS } from '../utils/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    this.generateTextures();
    this.scene.start(SCENE_KEYS.menu);
  }

  private generateTextures(): void {
    this.generateCarTexture('player-car', 60, 100, (g, w, h) => drawPlayerCar(g, w, h));

    for (let i = 0; i < 4; i += 1) {
      this.generateCarTexture(`enemy-car-${i + 1}`, 60, 100, (g, w, h) => drawEnemyCar(g, w, h, i));
    }

    this.generateCarTexture('road-tile', 390, 256, (g, w, h) => drawRoadTile(g, w, h));
    this.generateCarTexture('tree-left', 80, 120, (g, w, h) => drawTreeLeft(g, w, h));
    this.generateCarTexture('tree-right', 80, 120, (g, w, h) => drawTreeRight(g, w, h));
    this.generateCarTexture('particle-spark', 8, 8, (g, w, h) => drawParticleSpark(g, w, h));
  }

  private generateCarTexture(
    key: string,
    width: number,
    height: number,
    draw: (g: Phaser.GameObjects.Graphics, width: number, height: number) => void,
  ): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    draw(g, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
