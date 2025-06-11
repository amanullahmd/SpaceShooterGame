export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject {
  id: string;
  position: Position;
  velocity: Velocity;
  size: Size;
  rotation: number;
  health: number;
  maxHealth: number;
  isActive: boolean;
  // Animation properties
  animationTime?: number;
  scale?: number;
  opacity?: number;
  pulsePhase?: number;
}

export interface Player extends GameObject {
  playerId: string;
  playerName: string;
  score: number;
  lives: number;
  weaponType: WeaponType;
  powerUps: PowerUp[];
  isLocalPlayer: boolean;
}

export interface Enemy extends GameObject {
  enemyType: EnemyType;
  damage: number;
  points: number;
  attackPattern: AttackPattern;
}

export interface Bullet extends GameObject {
  damage: number;
  ownerId: string;
  bulletType: BulletType;
  isPlayerBullet: boolean;
}

export interface PowerUp extends GameObject {
  powerUpType: PowerUpType;
  duration: number;
  effect: PowerUpEffect;
}

export interface Explosion {
  id: string;
  position: Position;
  size: Size;
  duration: number;
  currentFrame: number;
  animationProgress: number;
}

export enum WeaponType {
  BASIC = 'basic',
  RAPID_FIRE = 'rapidFire',
  SPREAD_SHOT = 'spreadShot',
  LASER = 'laser',
  MISSILE = 'missile'
}

export enum EnemyType {
  BASIC = 'basic',
  FAST = 'fast',
  HEAVY = 'heavy',
  BOSS = 'boss'
}

export enum BulletType {
  PLAYER_BASIC = 'playerBasic',
  PLAYER_RAPID = 'playerRapid',
  PLAYER_LASER = 'playerLaser',
  ENEMY_BASIC = 'enemyBasic',
  ENEMY_HEAVY = 'enemyHeavy',
  NORMAL = 'normal',
  LASER = 'laser',
  PLASMA = 'plasma'
}

export enum PowerUpType {
  HEALTH = 'health',
  WEAPON_UPGRADE = 'weaponUpgrade',
  SHIELD = 'shield',
  SPEED_BOOST = 'speedBoost',
  SCORE_MULTIPLIER = 'scoreMultiplier'
}

export enum AttackPattern {
  STRAIGHT = 'straight',
  ZIGZAG = 'zigzag',
  CIRCULAR = 'circular',
  HOMING = 'homing'
}

export interface PowerUpEffect {
  type: PowerUpType;
  value: number;
  duration: number;
}

export interface GameState {
  players: Player[];
  enemies: Enemy[];
  bullets: Bullet[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  score: number;
  level: number;
  wave: number;
  enemiesKilled: number;
  powerUpsCollected: number;
  accuracy: number;
  gameStatus: GameStatus;
  isPaused: boolean;
  timeElapsed: number;
  isMultiplayer: boolean;
  roomId?: string;
}

export enum GameStatus {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
  VICTORY = 'victory',
  WAITING_FOR_PLAYERS = 'waitingForPlayers'
}

export interface GameConfig {
  screenWidth: number;
  screenHeight: number;
  playerSpeed: number;
  bulletSpeed: number;
  enemySpeed: number;
  spawnRate: number;
  difficulty: DifficultyLevel;
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface MultiplayerMessage {
  type: MessageType;
  playerId: string;
  data: any;
  timestamp: number;
}

export enum MessageType {
  PLAYER_JOIN = 'playerJoin',
  PLAYER_LEAVE = 'playerLeave',
  PLAYER_MOVE = 'playerMove',
  PLAYER_SHOOT = 'playerShoot',
  GAME_STATE_UPDATE = 'gameStateUpdate',
  GAME_START = 'gameStart',
  GAME_END = 'gameEnd'
}