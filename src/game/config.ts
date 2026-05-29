export const GAME = {
  backgroundColor: '#0c1020',
  skyTop: '#141a32',
  skyBottom: '#0c1020',

  fixedFps: 60,
  maxStepsPerFrame: 4,

  stair: {
    /** Visual block width of a tread. */
    stepWidthRatio: 0.26,
    /** Horizontal distance the path shifts left/right per step (zigzag span). */
    strideRatio: 0.46,
    stepHeightRatio: 0.124,
    treadDepthRatio: 0.05,
    color: 0x2a3358,
    edgeColor: 0x00f5d4,
    railColor: 0x1e2644,
  },

  player: {
    widthRatio: 0.07,
    heightRatio: 0.09,
    color: 0xffffff,
    suitColor: 0x4361ee,
    /** Steps to generate ahead of the player. */
    bufferSteps: 56,
    /** Run up stairs after a kill (steps per second). */
    climbStepsPerSec: 5,
  },

  aim: {
    /** Full up-down sweep cycles per second at level 1. */
    baseCyclesPerSec: 1.05,
    maxCyclesPerSec: 1.85,
    /** Half-angle of aim sweep (radians) at closest / farthest duels. */
    sweepMinRad: 0.12,
    sweepMaxRad: 0.38,
    lineLength: 140,
    lineColor: 0xff3366,
    headLineColor: 0x00f5d4,
  },

  encounter: {
    minStepsAhead: 2,
    maxStepsAhead: 8,
    bossEveryKills: 5,
    bossHpBase: 4,
    /** Delay after a miss before game over (enemy return fire). */
    missDeathDelayMs: 380,
  },

  economy: {
    coinPerKill: 8,
    comboBonusPer: 3,
    headshotBonus: 5,
  },

  combo: {
    windowMs: 1400,
    maxMultiplier: 5,
  },

  camera: {
    /** Player sits this far from bottom of screen (ratio). */
    playerScreenYRatio: 0.72,
    followLerp: 0.09,
  },

  bullet: {
    width: 4,
    trailLength: 6,
  },

  haptics: {
    shootMs: 6,
    killMs: 10,
    deathMs: 60,
  },

  input: {
    lockAfterStartMs: 120,
  },

  difficulty: {
    /** Every N kills = +1 level display. */
    killsPerLevel: 1,
    aimRampPerLevel: 0.012,
    rampLevels: 60,
  },
} as const
