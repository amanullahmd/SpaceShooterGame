import { PowerUp, PowerUpType, PowerUpEffect, GameState, GameConfig, Position } from '../types/GameTypes';

export class PowerUpSpawner {
  private config: GameConfig;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 15000; // 15 seconds base interval
  private spawnChance: number = 0.3; // 30% chance to spawn when interval is met

  constructor(config: GameConfig) {
    this.config = config;
    this.lastSpawnTime = Date.now();
  }

  public update(gameState: GameState, deltaTime: number): PowerUp[] {
    const newPowerUps: PowerUp[] = [];
    const currentTime = Date.now();

    // Check if it's time to potentially spawn a power-up
    if (this.shouldSpawnPowerUp(currentTime, gameState)) {
      const powerUp = this.createRandomPowerUp();
      if (powerUp) {
        newPowerUps.push(powerUp);
        this.lastSpawnTime = currentTime;
      }
    }

    return newPowerUps;
  }

  private shouldSpawnPowerUp(currentTime: number, gameState: GameState): boolean {
    // Don't spawn if interval hasn't passed
    if (currentTime - this.lastSpawnTime < this.spawnInterval) {
      return false;
    }

    // Don't spawn too many power-ups at once
    const activePowerUps = gameState.powerUps.filter(p => p.isActive).length;
    if (activePowerUps >= 3) {
      return false;
    }

    // Random chance to spawn
    return Math.random() < this.spawnChance;
  }

  private createRandomPowerUp(): PowerUp {
    const powerUpTypes = this.getAvailablePowerUpTypes();
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    return this.createPowerUp(randomType);
  }

  private getAvailablePowerUpTypes(): PowerUpType[] {
    return [
      PowerUpType.HEALTH,
      PowerUpType.WEAPON_UPGRADE,
      PowerUpType.SHIELD,
      PowerUpType.SPEED_BOOST,
      PowerUpType.SCORE_MULTIPLIER
    ];
  }

  private createPowerUp(type: PowerUpType): PowerUp {
    const position = this.getRandomSpawnPosition();
    const stats = this.getPowerUpStats(type);
    
    return {
      id: `powerup_${Date.now()}_${Math.random()}`,
      position,
      velocity: { x: 0, y: 50 }, // Slow downward movement
      size: stats.size,
      rotation: 0,
      health: 1,
      maxHealth: 1,
      isActive: true,
      powerUpType: type,
      duration: stats.duration,
      effect: stats.effect
    };
  }

  private getRandomSpawnPosition(): Position {
    return {
      x: Math.random() * (this.config.screenWidth - 60) + 30, // 30px margin
      y: -30 // Spawn above screen
    };
  }

  private getPowerUpStats(type: PowerUpType) {
    switch (type) {
      case PowerUpType.HEALTH:
        return {
          size: { width: 25, height: 25 },
          duration: 0, // Instant effect
          effect: {
            type: PowerUpType.HEALTH,
            value: 50, // Restore 50 health
            duration: 0
          } as PowerUpEffect
        };

      case PowerUpType.WEAPON_UPGRADE:
        return {
          size: { width: 30, height: 30 },
          duration: 10000, // 10 seconds
          effect: {
            type: PowerUpType.WEAPON_UPGRADE,
            value: 1, // Upgrade level
            duration: 10000
          } as PowerUpEffect
        };

      case PowerUpType.SHIELD:
        return {
          size: { width: 28, height: 28 },
          duration: 8000, // 8 seconds
          effect: {
            type: PowerUpType.SHIELD,
            value: 100, // Shield strength
            duration: 8000
          } as PowerUpEffect
        };

      case PowerUpType.SPEED_BOOST:
        return {
          size: { width: 26, height: 26 },
          duration: 6000, // 6 seconds
          effect: {
            type: PowerUpType.SPEED_BOOST,
            value: 1.5, // 50% speed increase
            duration: 6000
          } as PowerUpEffect
        };

      case PowerUpType.SCORE_MULTIPLIER:
        return {
          size: { width: 32, height: 32 },
          duration: 12000, // 12 seconds
          effect: {
            type: PowerUpType.SCORE_MULTIPLIER,
            value: 2, // 2x score multiplier
            duration: 12000
          } as PowerUpEffect
        };

      default:
        return {
          size: { width: 25, height: 25 },
          duration: 0,
          effect: {
            type: PowerUpType.HEALTH,
            value: 25,
            duration: 0
          } as PowerUpEffect
        };
    }
  }

  public spawnSpecificPowerUp(type: PowerUpType, position?: Position): PowerUp {
    const spawnPosition = position || this.getRandomSpawnPosition();
    return this.createPowerUp(type);
  }

  public spawnHealthPowerUp(position: Position): PowerUp {
    return this.spawnSpecificPowerUp(PowerUpType.HEALTH, position);
  }

  public spawnWeaponUpgrade(position: Position): PowerUp {
    return this.spawnSpecificPowerUp(PowerUpType.WEAPON_UPGRADE, position);
  }

  public adjustSpawnRate(difficulty: string): void {
    switch (difficulty) {
      case 'easy':
        this.spawnInterval = 12000; // 12 seconds
        this.spawnChance = 0.4; // 40% chance
        break;
      case 'medium':
        this.spawnInterval = 15000; // 15 seconds
        this.spawnChance = 0.3; // 30% chance
        break;
      case 'hard':
        this.spawnInterval = 18000; // 18 seconds
        this.spawnChance = 0.25; // 25% chance
        break;
      case 'expert':
        this.spawnInterval = 20000; // 20 seconds
        this.spawnChance = 0.2; // 20% chance
        break;
    }
  }

  public increaseDifficulty(): void {
    // Make power-ups spawn less frequently as game progresses
    this.spawnInterval = Math.min(25000, this.spawnInterval * 1.1);
    this.spawnChance = Math.max(0.15, this.spawnChance * 0.95);
  }

  public reset(): void {
    this.spawnInterval = 15000;
    this.spawnChance = 0.3;
    this.lastSpawnTime = Date.now();
  }

  public getSpawnInfo() {
    return {
      interval: this.spawnInterval,
      chance: this.spawnChance,
      timeSinceLastSpawn: Date.now() - this.lastSpawnTime
    };
  }

  // Special event power-up spawning
  public spawnBossDefeatReward(bossPosition: Position): PowerUp[] {
    const rewards: PowerUp[] = [];
    
    // Always spawn a health power-up when boss is defeated
    rewards.push(this.spawnHealthPowerUp({
      x: bossPosition.x - 30,
      y: bossPosition.y
    }));
    
    // 50% chance for weapon upgrade
    if (Math.random() < 0.5) {
      rewards.push(this.spawnWeaponUpgrade({
        x: bossPosition.x + 30,
        y: bossPosition.y
      }));
    }
    
    // 30% chance for score multiplier
    if (Math.random() < 0.3) {
      rewards.push(this.spawnSpecificPowerUp(PowerUpType.SCORE_MULTIPLIER, {
        x: bossPosition.x,
        y: bossPosition.y + 30
      }));
    }
    
    return rewards;
  }

  public spawnWaveCompleteReward(): PowerUp[] {
    const rewards: PowerUp[] = [];
    
    // 25% chance for a random power-up when wave is completed
    if (Math.random() < 0.25) {
      rewards.push(this.createRandomPowerUp());
    }
    
    return rewards;
  }
}