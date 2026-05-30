import Phaser from 'phaser';

const LANE_WIDTH = 80;
const LANE_DIVIDER_WIDTH = 4;
const LANE_DIVIDER_HALF = LANE_DIVIDER_WIDTH / 2;

export interface CarStyle {
  bodyColor: number;
  accentColor: number;
  windowColor: number;
  wheelColor: number;
  headlightColor: number;
  glowColor?: number;
  variant: number;
}

const ENEMY_STYLES: CarStyle[] = [
  {
    bodyColor: 0xe63946,
    accentColor: 0xb91c1c,
    windowColor: 0x1d3557,
    wheelColor: 0x212529,
    headlightColor: 0xfff3bf,
    variant: 0,
  },
  {
    bodyColor: 0xf77f00,
    accentColor: 0xea580c,
    windowColor: 0x264653,
    wheelColor: 0x1f2937,
    headlightColor: 0xffe066,
    variant: 1,
  },
  {
    bodyColor: 0xffd60a,
    accentColor: 0xfbbf24,
    windowColor: 0x334155,
    wheelColor: 0x111827,
    headlightColor: 0xffffff,
    variant: 2,
  },
  {
    bodyColor: 0x9d4edd,
    accentColor: 0x7b2cbf,
    windowColor: 0x2b2d42,
    wheelColor: 0x0f172a,
    headlightColor: 0xe0aaff,
    variant: 3,
  },
];

export const PLAYER_CAR_STYLE: CarStyle = {
  bodyColor: 0x00b4d8,
  accentColor: 0x0096c7,
  windowColor: 0x023e8a,
  wheelColor: 0x14213d,
  headlightColor: 0x90e0ef,
  glowColor: 0x48cae4,
  variant: -1,
};

function drawWheels(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  const wheelW = w * 0.18;
  const wheelH = h * 0.1;
  g.fillStyle(0x111111, 1);
  g.fillRoundedRect(w * 0.08, h * 0.18, wheelW, wheelH, 3);
  g.fillRoundedRect(w * 0.74, h * 0.18, wheelW, wheelH, 3);
  g.fillRoundedRect(w * 0.08, h * 0.72, wheelW, wheelH, 3);
  g.fillRoundedRect(w * 0.74, h * 0.72, wheelW, wheelH, 3);
}

function drawHeadlights(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
  g.fillStyle(color, 0.95);
  g.fillCircle(w * 0.22, h * 0.08, w * 0.07);
  g.fillCircle(w * 0.78, h * 0.08, w * 0.07);
}

function drawWindows(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, variant: number): void {
  g.fillStyle(color, 0.92);
  if (variant === 0) {
    g.fillRoundedRect(w * 0.2, h * 0.28, w * 0.6, h * 0.16, 5);
    g.fillRoundedRect(w * 0.22, h * 0.48, w * 0.56, h * 0.14, 4);
  } else if (variant === 1) {
    g.fillRoundedRect(w * 0.18, h * 0.26, w * 0.64, h * 0.2, 8);
    g.fillRoundedRect(w * 0.24, h * 0.5, w * 0.52, h * 0.12, 4);
  } else if (variant === 2) {
    g.fillRoundedRect(w * 0.16, h * 0.3, w * 0.3, h * 0.14, 4);
    g.fillRoundedRect(w * 0.54, h * 0.3, w * 0.3, h * 0.14, 4);
    g.fillRoundedRect(w * 0.22, h * 0.5, w * 0.56, h * 0.12, 4);
  } else if (variant === 3) {
    g.fillRoundedRect(w * 0.2, h * 0.27, w * 0.6, h * 0.18, 10);
    g.fillTriangle(w * 0.35, h * 0.5, w * 0.65, h * 0.5, w * 0.5, h * 0.62);
  } else {
    g.fillRoundedRect(w * 0.2, h * 0.28, w * 0.6, h * 0.17, 6);
    g.fillRoundedRect(w * 0.22, h * 0.5, w * 0.56, h * 0.13, 5);
  }
}

export function drawCar(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  style: CarStyle,
): void {
  const { bodyColor, accentColor, windowColor, wheelColor, headlightColor, glowColor, variant } = style;

  if (glowColor !== undefined) {
    g.fillStyle(glowColor, 0.35);
    g.fillRoundedRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9, 16);
  }

  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(width * 0.12, height * 0.1, width * 0.76, height * 0.78, 12);

  g.fillStyle(accentColor, 1);
  if (variant === 1) {
    g.fillRoundedRect(width * 0.12, height * 0.42, width * 0.76, height * 0.08, 2);
  } else if (variant === 2) {
    g.fillRoundedRect(width * 0.12, height * 0.1, width * 0.08, height * 0.78, 4);
    g.fillRoundedRect(width * 0.8, height * 0.1, width * 0.08, height * 0.78, 4);
  } else if (variant === 3) {
    g.fillRoundedRect(width * 0.12, height * 0.62, width * 0.76, height * 0.06, 2);
  }

  drawWindows(g, width, height, windowColor, variant);
  drawWheels(g, width, height);
  g.fillStyle(wheelColor, 1);
  g.fillCircle(width * 0.17, height * 0.23, width * 0.05);
  g.fillCircle(width * 0.83, height * 0.23, width * 0.05);
  g.fillCircle(width * 0.17, height * 0.77, width * 0.05);
  g.fillCircle(width * 0.83, height * 0.77, width * 0.05);
  drawHeadlights(g, width, height, headlightColor);
}

export function drawPlayerCar(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  drawCar(g, width, height, PLAYER_CAR_STYLE);
}

export function drawEnemyCar(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  index: number,
): void {
  const style = ENEMY_STYLES[index % ENEMY_STYLES.length];
  if (style) {
    drawCar(g, width, height, style);
  }
}

export function drawRoadTile(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  g.fillStyle(0x1a1a2e, 1);
  g.fillRect(0, 0, width, height);

  g.fillStyle(0x252545, 1);
  g.fillRect(0, 0, 8, height);
  g.fillRect(width - 8, 0, 8, height);

  g.fillStyle(0x3d3d5c, 1);
  g.fillRect(8, 0, 4, height);
  g.fillRect(width - 12, 0, 4, height);

  g.fillStyle(0xffffff, 0.85);
  const dashH = 28;
  const gap = 22;
  const centerX = width / 2;
  for (let y = 0; y < height; y += dashH + gap) {
    g.fillRect(centerX - LANE_DIVIDER_HALF, y, LANE_DIVIDER_WIDTH, dashH);
    g.fillRect(centerX - LANE_WIDTH - LANE_DIVIDER_HALF, y, LANE_DIVIDER_WIDTH, dashH);
    g.fillRect(centerX + LANE_WIDTH - LANE_DIVIDER_HALF, y, LANE_DIVIDER_WIDTH, dashH);
  }
}

export function drawTreeLeft(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  g.fillStyle(0x2d6a4f, 1);
  g.fillCircle(width * 0.55, height * 0.35, width * 0.35);
  g.fillCircle(width * 0.35, height * 0.5, width * 0.28);
  g.fillStyle(0x40916c, 1);
  g.fillCircle(width * 0.6, height * 0.55, width * 0.22);
  g.fillStyle(0x4a3728, 1);
  g.fillRect(width * 0.48, height * 0.62, width * 0.1, height * 0.3);
}

export function drawTreeRight(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  g.fillStyle(0x495057, 1);
  g.fillRect(width * 0.15, height * 0.2, width * 0.55, height * 0.12);
  g.fillRect(width * 0.25, height * 0.32, width * 0.45, height * 0.1);
  g.fillRect(width * 0.2, height * 0.42, width * 0.5, height * 0.08);
  g.fillStyle(0x6c757d, 1);
  g.fillRect(width * 0.35, height * 0.52, width * 0.12, height * 0.35);
  g.fillStyle(0x343a40, 1);
  for (let row = 0; row < 4; row += 1) {
    g.fillRect(width * 0.2 + row * 8, height * 0.22 + row * 10, width * 0.08, height * 0.06);
  }
}

export function drawParticleSpark(g: Phaser.GameObjects.Graphics, size: number): void {
  g.fillStyle(0xffffff, 1);
  g.fillCircle(size / 2, size / 2, size / 2);
}
