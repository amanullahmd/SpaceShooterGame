import { GameState, GameObject, Position, Velocity, GameConfig } from '../types/GameTypes';

export class PhysicsEngine {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public update(gameState: GameState, deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000;

    // Update players
    gameState.players.forEach(player => {
      if (player.isActive) {
        this.updateGameObject(player, deltaSeconds);
        this.constrainToScreen(player);
      }
    });

    // Update enemies
    gameState.enemies.forEach(enemy => {
      if (enemy.isActive) {
        this.updateGameObject(enemy, deltaSeconds);
        this.updateEnemyBehavior(enemy, gameState, deltaSeconds);
        
        // Remove enemies that go off screen
        if (!this.isOnScreen(enemy)) {
          enemy.isActive = false;
        }
      }
    });

    // Update bullets
    gameState.bullets.forEach(bullet => {
      if (bullet.isActive) {
        this.updateGameObject(bullet, deltaSeconds);
        
        // Remove bullets that go off screen
        if (!this.isOnScreen(bullet)) {
          bullet.isActive = false;
        }
      }
    });

    // Update power-ups
    gameState.powerUps.forEach(powerUp => {
      if (powerUp.isActive) {
        this.updateGameObject(powerUp, deltaSeconds);
        
        // Add floating animation to power-ups
        powerUp.position.y += Math.sin(Date.now() * 0.005) * 0.5;
        
        // Remove power-ups that go off screen
        if (!this.isOnScreen(powerUp)) {
          powerUp.isActive = false;
        }
      }
    });
  }

  private updateGameObject(obj: GameObject, deltaTime: number): void {
    // Update position based on velocity
    obj.position.x += obj.velocity.x * deltaTime;
    obj.position.y += obj.velocity.y * deltaTime;

    // Apply rotation if needed
    if (obj.velocity.x !== 0 || obj.velocity.y !== 0) {
      obj.rotation = Math.atan2(obj.velocity.y, obj.velocity.x) + Math.PI / 2;
    }
  }

  private updateEnemyBehavior(enemy: any, gameState: GameState, deltaTime: number): void {
    switch (enemy.attackPattern) {
      case 'straight':
        // Already handled by basic velocity update
        break;
        
      case 'zigzag':
        enemy.velocity.x = Math.sin(Date.now() * 0.005) * 100;
        break;
        
      case 'circular':
        const radius = 50;
        const speed = 2;
        const time = Date.now() * 0.001 * speed;
        enemy.velocity.x = Math.cos(time) * radius;
        enemy.velocity.y = Math.sin(time) * radius + 50; // Still move down
        break;
        
      case 'homing':
        const nearestPlayer = this.findNearestPlayer(enemy, gameState.players);
        if (nearestPlayer) {
          const dx = nearestPlayer.position.x - enemy.position.x;
          const dy = nearestPlayer.position.y - enemy.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const homingSpeed = 100;
            enemy.velocity.x = (dx / distance) * homingSpeed;
            enemy.velocity.y = (dy / distance) * homingSpeed;
          }
        }
        break;
    }

    // Enemy shooting logic
    this.handleEnemyShooting(enemy, gameState, deltaTime);
  }

  private handleEnemyShooting(enemy: any, gameState: GameState, deltaTime: number): void {
    // Simple shooting logic - enemies shoot periodically
    if (!enemy.lastShotTime) {
      enemy.lastShotTime = Date.now();
    }

    const shootInterval = this.getEnemyShootInterval(enemy.enemyType);
    if (Date.now() - enemy.lastShotTime > shootInterval) {
      const bullet = this.createEnemyBullet(enemy);
      if (bullet) {
        gameState.bullets.push(bullet);
        enemy.lastShotTime = Date.now();
      }
    }
  }

  private getEnemyShootInterval(enemyType: string): number {
    switch (enemyType) {
      case 'basic': return 2000; // 2 seconds
      case 'fast': return 1500;  // 1.5 seconds
      case 'heavy': return 3000; // 3 seconds
      case 'boss': return 1000;  // 1 second
      default: return 2000;
    }
  }

  private createEnemyBullet(enemy: any): any {
    return {
      id: `enemy_bullet_${Date.now()}_${Math.random()}`,
      position: {
        x: enemy.position.x,
        y: enemy.position.y + enemy.size.height / 2
      },
      velocity: { x: 0, y: 150 }, // Move down
      size: { width: 6, height: 12 },
      rotation: 0,
      health: 1,
      maxHealth: 1,
      isActive: true,
      damage: 10,
      ownerId: enemy.id,
      bulletType: 'enemyBasic'
    };
  }

  private findNearestPlayer(enemy: any, players: any[]): any {
    let nearestPlayer = null;
    let nearestDistance = Infinity;

    players.forEach(player => {
      if (player.isActive) {
        const dx = player.position.x - enemy.position.x;
        const dy = player.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPlayer = player;
        }
      }
    });

    return nearestPlayer;
  }

  private constrainToScreen(obj: GameObject): void {
    const halfWidth = obj.size.width / 2;
    const halfHeight = obj.size.height / 2;

    // Constrain X position
    if (obj.position.x - halfWidth < 0) {
      obj.position.x = halfWidth;
      obj.velocity.x = 0;
    } else if (obj.position.x + halfWidth > this.config.screenWidth) {
      obj.position.x = this.config.screenWidth - halfWidth;
      obj.velocity.x = 0;
    }

    // Constrain Y position
    if (obj.position.y - halfHeight < 0) {
      obj.position.y = halfHeight;
      obj.velocity.y = 0;
    } else if (obj.position.y + halfHeight > this.config.screenHeight) {
      obj.position.y = this.config.screenHeight - halfHeight;
      obj.velocity.y = 0;
    }
  }

  private isOnScreen(obj: GameObject): boolean {
    const margin = 100; // Allow objects to go slightly off screen before removing
    return (
      obj.position.x > -margin &&
      obj.position.x < this.config.screenWidth + margin &&
      obj.position.y > -margin &&
      obj.position.y < this.config.screenHeight + margin
    );
  }

  public applyForce(obj: GameObject, force: Velocity, deltaTime: number): void {
    obj.velocity.x += force.x * deltaTime;
    obj.velocity.y += force.y * deltaTime;
  }

  public applyDamping(obj: GameObject, dampingFactor: number, deltaTime: number): void {
    const damping = Math.pow(dampingFactor, deltaTime);
    obj.velocity.x *= damping;
    obj.velocity.y *= damping;
  }

  public setVelocity(obj: GameObject, velocity: Velocity): void {
    obj.velocity.x = velocity.x;
    obj.velocity.y = velocity.y;
  }

  public addVelocity(obj: GameObject, velocity: Velocity): void {
    obj.velocity.x += velocity.x;
    obj.velocity.y += velocity.y;
  }

  public getSpeed(obj: GameObject): number {
    return Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
  }

  public normalizeVelocity(obj: GameObject, targetSpeed: number): void {
    const currentSpeed = this.getSpeed(obj);
    if (currentSpeed > 0) {
      const factor = targetSpeed / currentSpeed;
      obj.velocity.x *= factor;
      obj.velocity.y *= factor;
    }
  }

  public moveTowards(obj: GameObject, target: Position, speed: number, deltaTime: number): void {
    const dx = target.x - obj.position.x;
    const dy = target.y - obj.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const moveDistance = Math.min(speed * deltaTime, distance);
      const factor = moveDistance / distance;
      
      obj.position.x += dx * factor;
      obj.position.y += dy * factor;
      
      // Update velocity to reflect movement
      obj.velocity.x = (dx / distance) * speed;
      obj.velocity.y = (dy / distance) * speed;
    } else {
      obj.velocity.x = 0;
      obj.velocity.y = 0;
    }
  }

  public rotateTowards(obj: GameObject, target: Position, rotationSpeed: number, deltaTime: number): void {
    const dx = target.x - obj.position.x;
    const dy = target.y - obj.position.y;
    const targetRotation = Math.atan2(dy, dx) + Math.PI / 2;
    
    let angleDiff = targetRotation - obj.rotation;
    
    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    const maxRotation = rotationSpeed * deltaTime;
    if (Math.abs(angleDiff) <= maxRotation) {
      obj.rotation = targetRotation;
    } else {
      obj.rotation += Math.sign(angleDiff) * maxRotation;
    }
  }
}