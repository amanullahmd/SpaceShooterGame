import { GameState, GameObject, Position, Velocity, GameConfig, Player, Enemy, Bullet, PowerUp, Explosion, GameStatus } from '../types/GameTypes';
import { CollisionDetection } from './CollisionDetection';
import { PhysicsEngine } from './PhysicsEngine';
import { EnemySpawner } from './EnemySpawner';
import { PowerUpSpawner } from './PowerUpSpawner';
import { SoundManager } from './SoundManager';

export class GameEngine {
  private gameState!: GameState;
  private config: GameConfig;
  private collisionDetection!: CollisionDetection;
  private physicsEngine!: PhysicsEngine;
  private enemySpawner!: EnemySpawner;
  private powerUpSpawner!: PowerUpSpawner;
  private soundManager!: SoundManager;
  private lastUpdateTime: number = 0;
  private gameLoopId: number | null = null;
  private onStateUpdate: (state: GameState) => void;

  constructor(config: GameConfig, onStateUpdate: (state: GameState) => void) {
    this.config = config;
    this.onStateUpdate = onStateUpdate;
    this.initializeGameState();
    this.initializeEngines();
  }

  private initializeGameState(): void {
    this.gameState = {
      players: [],
      enemies: [],
      bullets: [],
      powerUps: [],
      explosions: [],
      score: 0,
      level: 1,
      wave: 1,
      enemiesKilled: 0,
      powerUpsCollected: 0,
      accuracy: 0,
      gameStatus: GameStatus.MENU,
      isPaused: false,
      timeElapsed: 0,
      isMultiplayer: false
    };
  }

  private initializeEngines(): void {
    this.collisionDetection = new CollisionDetection();
    this.physicsEngine = new PhysicsEngine(this.config);
    this.enemySpawner = new EnemySpawner(this.config);
    this.powerUpSpawner = new PowerUpSpawner(this.config);
    this.soundManager = new SoundManager();
  }

  public startGame(isMultiplayer: boolean = false): void {
    this.gameState.gameStatus = GameStatus.PLAYING;
    this.gameState.isMultiplayer = isMultiplayer;
    this.gameState.isPaused = false;
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
  }

  public pauseGame(): void {
    this.gameState.isPaused = true;
    this.gameState.gameStatus = GameStatus.PAUSED;
    this.stopGameLoop();
  }

  public resumeGame(): void {
    this.gameState.isPaused = false;
    this.gameState.gameStatus = GameStatus.PLAYING;
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
  }

  public stopGame(): void {
    this.gameState.gameStatus = GameStatus.GAME_OVER;
    this.stopGameLoop();
  }

  public addPlayer(player: Player): void {
    this.gameState.players.push(player);
  }

  public removePlayer(playerId: string): void {
    this.gameState.players = this.gameState.players.filter(p => p.playerId !== playerId);
  }

  public updatePlayerPosition(playerId: string, position: Position): void {
    const player = this.gameState.players.find(p => p.playerId === playerId);
    if (player) {
      player.position = position;
    }
  }

  public playerShoot(playerId: string): void {
    const player = this.gameState.players.find(p => p.playerId === playerId);
    if (player && this.gameState.gameStatus === GameStatus.PLAYING) {
      const bullets = this.createPlayerBullets(player);
      this.gameState.bullets.push(...bullets);
      this.soundManager.playShootSound(player.weaponType);
    }
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  private createPlayerBullets(player: Player): Bullet[] {
    // Implementation for different weapon types
    const bullets: Bullet[] = [];
    const basePosition = { x: player.position.x, y: player.position.y - player.size.height / 2 };
    
    switch (player.weaponType) {
      case 'basic':
        bullets.push(this.createBullet(basePosition, { x: 0, y: -this.config.bulletSpeed }, player.playerId, 'playerBasic'));
        break;
      case 'spreadShot':
        for (let i = -1; i <= 1; i++) {
          bullets.push(this.createBullet(
            { x: basePosition.x + i * 10, y: basePosition.y },
            { x: i * 50, y: -this.config.bulletSpeed },
            player.playerId,
            'playerBasic'
          ));
        }
        break;
      // Add more weapon types
    }
    
    return bullets;
  }

  private createBullet(position: Position, velocity: Velocity, ownerId: string, bulletType: string): Bullet {
    const isPlayerBullet = this.gameState.players.some(player => player.id === ownerId);
    return {
      id: `bullet_${Date.now()}_${Math.random()}`,
      position: { ...position },
      velocity: { ...velocity },
      size: { width: 4, height: 10 },
      rotation: 0,
      health: 1,
      maxHealth: 1,
      isActive: true,
      damage: 10,
      ownerId,
      bulletType: bulletType as any,
      isPlayerBullet
    };
  }

  private startGameLoop(): void {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
    
    const gameLoop = () => {
      if (this.gameState.gameStatus === GameStatus.PLAYING && !this.gameState.isPaused) {
        this.update();
        this.gameLoopId = requestAnimationFrame(gameLoop);
      }
    };
    
    this.gameLoopId = requestAnimationFrame(gameLoop);
  }

  private stopGameLoop(): void {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  private update(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Update game time
    this.gameState.timeElapsed += deltaTime;

    // Update physics
    this.physicsEngine.update(this.gameState, deltaTime);

    // Spawn enemies
    const newEnemies = this.enemySpawner.update(this.gameState, deltaTime);
    this.gameState.enemies.push(...newEnemies);

    // Spawn power-ups
    const newPowerUps = this.powerUpSpawner.update(this.gameState, deltaTime);
    this.gameState.powerUps.push(...newPowerUps);

    // Handle collisions
    this.handleCollisions();

    // Clean up inactive objects
    this.cleanupInactiveObjects();

    // Update explosions
    this.updateExplosions(deltaTime);

    // Check game over conditions
    this.checkGameOverConditions();

    // Notify state update
    this.onStateUpdate({ ...this.gameState });
  }

  private handleCollisions(): void {
    // Player-Enemy collisions
    this.gameState.players.forEach(player => {
      this.gameState.enemies.forEach(enemy => {
        if (this.collisionDetection.checkCollision(player, enemy)) {
          this.handlePlayerEnemyCollision(player, enemy);
        }
      });
    });

    // Bullet-Enemy collisions
    this.gameState.bullets.forEach(bullet => {
      if (bullet.bulletType.startsWith('player')) {
        this.gameState.enemies.forEach(enemy => {
          if (this.collisionDetection.checkCollision(bullet, enemy)) {
            this.handleBulletEnemyCollision(bullet, enemy);
          }
        });
      }
    });

    // Bullet-Player collisions (for enemy bullets)
    this.gameState.bullets.forEach(bullet => {
      if (bullet.bulletType.startsWith('enemy')) {
        this.gameState.players.forEach(player => {
          if (this.collisionDetection.checkCollision(bullet, player)) {
            this.handleBulletPlayerCollision(bullet, player);
          }
        });
      }
    });

    // Player-PowerUp collisions
    this.gameState.players.forEach(player => {
      this.gameState.powerUps.forEach(powerUp => {
        if (this.collisionDetection.checkCollision(player, powerUp)) {
          this.handlePlayerPowerUpCollision(player, powerUp);
        }
      });
    });
  }

  private handlePlayerEnemyCollision(player: Player, enemy: Enemy): void {
    player.health -= enemy.damage;
    enemy.isActive = false;
    this.createExplosion(enemy.position, 30);
    this.soundManager.playExplosionSound();
    
    if (player.health <= 0) {
      player.lives--;
      player.health = player.maxHealth;
      if (player.lives <= 0) {
        player.isActive = false;
      }
    }
  }

  private handleBulletEnemyCollision(bullet: Bullet, enemy: Enemy): void {
    enemy.health -= bullet.damage;
    bullet.isActive = false;
    
    if (enemy.health <= 0) {
      enemy.isActive = false;
      this.gameState.score += enemy.points;
      this.createExplosion(enemy.position, 25);
      this.soundManager.playExplosionSound();
    }
  }

  private handleBulletPlayerCollision(bullet: Bullet, player: Player): void {
    player.health -= bullet.damage;
    bullet.isActive = false;
    
    if (player.health <= 0) {
      player.lives--;
      player.health = player.maxHealth;
      if (player.lives <= 0) {
        player.isActive = false;
      }
    }
  }

  private handlePlayerPowerUpCollision(player: Player, powerUp: PowerUp): void {
    powerUp.isActive = false;
    this.applyPowerUp(player, powerUp);
    this.soundManager.playPowerUpSound();
  }

  private applyPowerUp(player: Player, powerUp: PowerUp): void {
    switch (powerUp.powerUpType) {
      case 'health':
        player.health = Math.min(player.health + powerUp.effect.value, player.maxHealth);
        break;
      case 'weaponUpgrade':
        // Upgrade weapon logic
        break;
      case 'shield':
        // Shield logic
        break;
      // Add more power-up effects
    }
  }

  private createExplosion(position: Position, size: number): void {
    const explosion: Explosion = {
      id: `explosion_${Date.now()}_${Math.random()}`,
      position: { ...position },
      size: { width: size, height: size },
      duration: 500, // 500ms
      currentFrame: 0,
      animationProgress: 0
    };
    this.gameState.explosions.push(explosion);
  }

  private updateExplosions(deltaTime: number): void {
    this.gameState.explosions = this.gameState.explosions.filter(explosion => {
      explosion.currentFrame += deltaTime;
      explosion.animationProgress = Math.min(explosion.currentFrame / explosion.duration, 1);
      return explosion.currentFrame < explosion.duration;
    });
  }

  private cleanupInactiveObjects(): void {
    this.gameState.players = this.gameState.players.filter(p => p.isActive);
    this.gameState.enemies = this.gameState.enemies.filter(e => e.isActive);
    this.gameState.bullets = this.gameState.bullets.filter(b => b.isActive);
    this.gameState.powerUps = this.gameState.powerUps.filter(p => p.isActive);
  }

  private checkGameOverConditions(): void {
    const activePlayers = this.gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
      this.gameState.gameStatus = GameStatus.GAME_OVER;
      this.stopGameLoop();
    }
  }

  public dispose(): void {
    this.stopGameLoop();
    this.soundManager.dispose();
  }
}