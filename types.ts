
export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: 'player' | 'enemy' | 'platform' | 'coin' | 'gemini-block' | 'goal';
  id: string;
}

export interface GameState {
  player: Entity;
  entities: Entity[];
  score: number;
  status: 'playing' | 'gameover' | 'won' | 'paused';
  cameraX: number;
  aiHint: string;
}

export const GRAVITY = 0.8;
export const JUMP_FORCE = -16;
export const MOVE_SPEED = 5;
export const FRICTION = 0.85;
export const WORLD_WIDTH = 5000;
export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
