export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const LANE_COUNT = 3;
export const LANE_WIDTH = 80;
export const LANES_X = [
  GAME_WIDTH / 2 - LANE_WIDTH,
  GAME_WIDTH / 2,
  GAME_WIDTH / 2 + LANE_WIDTH,
] as const;

export const CAR_WIDTH = 54;
export const CAR_HEIGHT = 90;

export const PLAYER_Y = GAME_HEIGHT - 160;
export const ROAD_COLOR = 0x1a1a2e;

export const INITIAL_GAME_SPEED = 300;
export const MAX_GAME_SPEED = 800;
export const SPEED_INCREMENT = 20;
export const DIFFICULTY_INTERVAL_MS = 10_000;

export const INITIAL_SPAWN_INTERVAL = 1200;
export const SPAWN_INTERVAL_DECREMENT = 50;
export const MIN_SPAWN_INTERVAL = 400;

export const LANE_CHANGE_DURATION_MS = 150;
export const HITBOX_SCALE = 0.7;

export const BULLET_WIDTH = 8;
export const BULLET_HEIGHT = 20;
export const BULLET_SPEED = 680;
export const FIRE_RATE_MS = 240;
export const KILL_SCORE_BONUS = 15;

export const BEST_SCORE_KEY = 'skillJumper_best';

export const SCENE_KEYS = {
  boot: 'BootScene',
  menu: 'MenuScene',
  game: 'GameScene',
  gameOver: 'GameOverScene',
} as const;
