import { Enemy, EnemyType, AttackPattern, GameState, GameConfig, Position } from '../types/GameTypes';

export class EnemySpawner {
  private config: GameConfig;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 2000; // Base spawn interval in ms
  private waveNumber: number = 1;
  private enemiesInCurrentWave: number = 0;
  private maxEnemiesPerWave: number = 5;
  private timeBetweenWaves: number = 5000; // 5 seconds between waves
  private lastWaveTime: number = 0;
  private bossSpawned: boolean = false;

  constructor(config: GameConfig) {
    this.config = config;
    this.lastSpawnTime = Date.now();
    this.lastWaveTime = Date.now();
  }

  public update(gameState: GameState, deltaTime: number): Enemy[] {
    const newEnemies: Enemy[] = [];
    const currentTime = Date.now();

    // Check if it's time to spawn a new wave
    if (this.shouldStartNewWave(gameState, currentTime)) {
      this.startNewWave();
    }

    // Check if it's time to spawn a boss
    if (this.shouldSpawnBoss(gameState)) {
      const boss = this.createBoss();
      if (boss) {
        newEnemies.push(boss);
        this.bossSpawned = true;
      }
    }

    // Regular enemy spawning
    if (this.shouldSpawnEnemy(currentTime) && this.enemiesInCurrentWave < this.maxEnemiesPerWave) {
      const enemy = this.createRandomEnemy();
      if (enemy) {
        newEnemies.push(enemy);
        this.enemiesInCurrentWave++;
        this.lastSpawnTime = currentTime;
      }
    }

    return newEnemies;
  }

  private shouldStartNewWave(gameState: GameState, currentTime: number): boolean {
    // Start new wave if all enemies are defeated and enough time has passed
    const activeEnemies = gameState.enemies.filter(e => e.isActive).length;
    const timeSinceLastWave = currentTime - this.lastWaveTime;
    
    return activeEnemies === 0 && 
           timeSinceLastWave > this.timeBetweenWaves && 
           this.enemiesInCurrentWave >= this.maxEnemiesPerWave;
  }

  private startNewWave(): void {
    this.waveNumber++;
    this.enemiesInCurrentWave = 0;
    this.lastWaveTime = Date.now();
    this.bossSpawned = false;
    
    // Increase difficulty
    this.scaleDifficulty();
  }

  private scaleDifficulty(): void {
    // Decrease spawn interval (spawn faster)
    this.spawnInterval = Math.max(500, this.spawnInterval * 0.9);
    
    // Increase enemies per wave
    this.maxEnemiesPerWave = Math.min(15, this.maxEnemiesPerWave + 1);
    
    // Decrease time between waves
    this.timeBetweenWaves = Math.max(2000, this.timeBetweenWaves * 0.95);
  }

  private shouldSpawnBoss(gameState: GameState): boolean {
    // Spawn boss every 5 waves
    return this.waveNumber % 5 === 0 && 
           !this.bossSpawned && 
           this.enemiesInCurrentWave >= this.maxEnemiesPerWave * 0.8;
  }

  private shouldSpawnEnemy(currentTime: number): boolean {
    return currentTime - this.lastSpawnTime > this.spawnInterval;
  }

  private createRandomEnemy(): Enemy {
    const enemyTypes = this.getAvailableEnemyTypes();
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    return this.createEnemy(randomType);
  }

  private getAvailableEnemyTypes(): EnemyType[] {
    const types: EnemyType[] = [EnemyType.BASIC];
    
    if (this.waveNumber >= 2) {
      types.push(EnemyType.FAST);
    }
    
    if (this.waveNumber >= 3) {
      types.push(EnemyType.HEAVY);
    }
    
    return types;
  }

  private createEnemy(type: EnemyType): Enemy {
    const position = this.getRandomSpawnPosition();
    const baseStats = this.getEnemyStats(type);
    
    return {
      id: `enemy_${Date.now()}_${Math.random()}`,
      position,
      velocity: { x: 0, y: baseStats.speed },
      size: baseStats.size,
      rotation: 0,
      health: baseStats.health,
      maxHealth: baseStats.health,
      isActive: true,
      enemyType: type,
      damage: baseStats.damage,
      points: baseStats.points,
      attackPattern: this.getRandomAttackPattern(type)
    };
  }

  private createBoss(): Enemy {
    const position: Position = {
      x: this.config.screenWidth / 2,
      y: -50
    };
    
    const bossStats = this.getBossStats();
    
    return {
      id: `boss_${Date.now()}_${Math.random()}`,
      position,
      velocity: { x: 0, y: 30 }, // Slower than regular enemies
      size: bossStats.size,
      rotation: 0,
      health: bossStats.health,
      maxHealth: bossStats.health,
      isActive: true,
      enemyType: EnemyType.BOSS,
      damage: bossStats.damage,
      points: bossStats.points,
      attackPattern: AttackPattern.CIRCULAR
    };
  }

  private getRandomSpawnPosition(): Position {
    return {
      x: Math.random() * (this.config.screenWidth - 60) + 30, // 30px margin
      y: -30 // Spawn above screen
    };
  }

  private getEnemyStats(type: EnemyType) {
    const difficultyMultiplier = 1 + (this.waveNumber - 1) * 0.1;
    
    switch (type) {
      case EnemyType.BASIC:
        return {
          health: Math.floor(10 * difficultyMultiplier),
          damage: Math.floor(10 * difficultyMultiplier),
          speed: 80 + (this.waveNumber * 5),
          points: 100,
          size: { width: 30, height: 30 }
        };
        
      case EnemyType.FAST:
        return {
          health: Math.floor(5 * difficultyMultiplier),
          damage: Math.floor(8 * difficultyMultiplier),
          speed: 150 + (this.waveNumber * 8),
          points: 150,
          size: { width: 25, height: 25 }
        };
        
      case EnemyType.HEAVY:
        return {
          health: Math.floor(25 * difficultyMultiplier),
          damage: Math.floor(20 * difficultyMultiplier),
          speed: 50 + (this.waveNumber * 3),
          points: 300,
          size: { width: 40, height: 40 }
        };
        
      default:
        return {
          health: Math.floor(10 * difficultyMultiplier),
          damage: Math.floor(10 * difficultyMultiplier),
          speed: 80,
          points: 100,
          size: { width: 30, height: 30 }
        };
    }
  }

  private getBossStats() {
    const difficultyMultiplier = 1 + (this.waveNumber - 1) * 0.15;
    
    return {
      health: Math.floor(200 * difficultyMultiplier),
      damage: Math.floor(30 * difficultyMultiplier),
      points: 1000 * Math.floor(this.waveNumber / 5),
      size: { width: 80, height: 80 }
    };
  }

  private getRandomAttackPattern(type: EnemyType): AttackPattern {
    switch (type) {
      case EnemyType.BASIC:
        return Math.random() < 0.7 ? AttackPattern.STRAIGHT : AttackPattern.ZIGZAG;
        
      case EnemyType.FAST:
        const fastPatterns = [AttackPattern.STRAIGHT, AttackPattern.ZIGZAG];
        return fastPatterns[Math.floor(Math.random() * fastPatterns.length)];
        
      case EnemyType.HEAVY:
        return Math.random() < 0.5 ? AttackPattern.STRAIGHT : AttackPattern.HOMING;
        
      case EnemyType.BOSS:
        return AttackPattern.CIRCULAR;
        
      default:
        return AttackPattern.STRAIGHT;
    }
  }

  public getCurrentWave(): number {
    return this.waveNumber;
  }

  public getEnemiesInWave(): number {
    return this.enemiesInCurrentWave;
  }

  public getMaxEnemiesPerWave(): number {
    return this.maxEnemiesPerWave;
  }

  public reset(): void {
    this.waveNumber = 1;
    this.enemiesInCurrentWave = 0;
    this.maxEnemiesPerWave = 5;
    this.spawnInterval = 2000;
    this.timeBetweenWaves = 5000;
    this.lastSpawnTime = Date.now();
    this.lastWaveTime = Date.now();
    this.bossSpawned = false;
  }

  public setDifficulty(difficulty: string): void {
    switch (difficulty) {
      case 'easy':
        this.spawnInterval = 3000;
        this.maxEnemiesPerWave = 3;
        break;
      case 'medium':
        this.spawnInterval = 2000;
        this.maxEnemiesPerWave = 5;
        break;
      case 'hard':
        this.spawnInterval = 1500;
        this.maxEnemiesPerWave = 7;
        break;
      case 'expert':
        this.spawnInterval = 1000;
        this.maxEnemiesPerWave = 10;
        break;
    }
  }
}