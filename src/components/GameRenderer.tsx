import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { GameState, Player, Enemy, Bullet, PowerUp, Explosion } from '../types/GameTypes';

interface GameRendererProps {
  gameState: GameState;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GameRenderer: React.FC<GameRendererProps> = ({ gameState }) => {
  const currentTime = Date.now();
  
  const renderPlayer = (player: Player, index: number) => {
    const { position, size, rotation, health, maxHealth } = player;
    const healthPercentage = health / maxHealth;
    const animTime = (currentTime * 0.01) % (Math.PI * 2);
    const scale = player.scale || 1;
    const opacity = player.opacity || 1;
    
    // Engine pulse animation
    const enginePulse = 0.5 + 0.5 * Math.sin(animTime * 3);
    const engineSize = 3 + enginePulse * 2;
    
    // Shield pulse if active
    const shieldPulse = 0.6 + 0.4 * Math.sin(animTime * 2);
    
    return (
      <G key={`player_${player.id}`} transform={`translate(${position.x}, ${position.y}) rotate(${rotation * 180 / Math.PI}) scale(${scale})`} opacity={opacity}>
        {/* Engine trail particles */}
        {[...Array(5)].map((_, i) => (
          <Circle
            key={`trail_${i}`}
            cx={Math.sin(animTime + i) * 2}
            cy={size.height/3 + i * 8}
            r={2 - i * 0.3}
            fill="#ff4400"
            opacity={enginePulse * (0.8 - i * 0.15)}
          />
        ))}
        
        {/* Player ship with subtle glow */}
        <Polygon
          points={`0,-${size.height/2} -${size.width/3},${size.height/2} ${size.width/3},${size.height/2}`}
          fill={player.isLocalPlayer ? "#00ff00" : "#0080ff"}
          stroke="#ffffff"
          strokeWidth="1"
          filter="url(#glow)"
        />
        
        {/* Animated engine glow */}
        <Circle
          cx="0"
          cy={size.height/3}
          r={engineSize}
          fill="#ff4400"
          opacity={enginePulse * 0.8}
        />
        <Circle
          cx="0"
          cy={size.height/3}
          r={engineSize * 0.6}
          fill="#ffff00"
          opacity={enginePulse}
        />
        
        {/* Health bar */}
        <Rect
          x={-size.width/2}
          y={-size.height/2 - 10}
          width={size.width}
          height="3"
          fill="#333333"
        />
        <Rect
          x={-size.width/2}
          y={-size.height/2 - 10}
          width={size.width * healthPercentage}
          height="3"
          fill={healthPercentage > 0.5 ? "#00ff00" : healthPercentage > 0.25 ? "#ffff00" : "#ff0000"}
        />
        
        {/* Animated shield effect if player has shield power-up */}
        {player.powerUps.some(p => p.powerUpType === 'shield') && (
          <G>
            <Circle
              cx="0"
              cy="0"
              r={size.width + Math.sin(animTime * 4) * 3}
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
              opacity={shieldPulse}
            />
            <Circle
              cx="0"
              cy="0"
              r={size.width * 0.8}
              fill="#00ffff"
              opacity={shieldPulse * 0.1}
            />
          </G>
        )}
      </G>
    );
  };

  const renderEnemy = (enemy: Enemy, index: number) => {
    const { position, size, rotation, health, maxHealth, enemyType } = enemy;
    const healthPercentage = health / maxHealth;
    const animTime = (currentTime * 0.01 + index) % (Math.PI * 2);
    const scale = enemy.scale || 1;
    const opacity = enemy.opacity || 1;
    
    // Damage flash effect
    const damageFlash = healthPercentage < 0.3 ? 0.5 + 0.5 * Math.sin(animTime * 8) : 1;
    
    let enemyColor = "#ff0000";
    let enemyShape;
    let additionalEffects = [];
    
    switch (enemyType) {
      case 'basic':
        enemyColor = "#ff0000";
        const basicPulse = 0.9 + 0.1 * Math.sin(animTime * 2);
        enemyShape = (
          <Polygon
            points={`0,${size.height/2} -${size.width/2},-${size.height/2} ${size.width/2},-${size.height/2}`}
            fill={enemyColor}
            stroke="#ffffff"
            strokeWidth="1"
            opacity={damageFlash}
            transform={`scale(${basicPulse})`}
          />
        );
        break;
        
      case 'fast':
        enemyColor = "#ff8800";
        const fastSpin = animTime * 4;
        enemyShape = (
          <G transform={`rotate(${fastSpin * 180 / Math.PI})`}>
            <Polygon
              points={`0,${size.height/2} -${size.width/3},-${size.height/3} -${size.width/2},-${size.height/2} ${size.width/2},-${size.height/2} ${size.width/3},-${size.height/3}`}
              fill={enemyColor}
              stroke="#ffffff"
              strokeWidth="1"
              opacity={damageFlash}
            />
            {/* Speed trail effect */}
            {[...Array(3)].map((_, i) => (
              <Circle
                key={`speed_trail_${i}`}
                cx={Math.sin(animTime + i) * 3}
                cy={size.height/2 + i * 5}
                r={1}
                fill="#ff8800"
                opacity={0.6 - i * 0.2}
              />
            ))}
          </G>
        );
        break;
        
      case 'heavy':
        enemyColor = "#8800ff";
        const heavyPulse = 0.8 + 0.2 * Math.sin(animTime * 1.5);
        enemyShape = (
          <G>
            {/* Glow effect */}
            <Rect
              x={-size.width/2 - 3}
              y={-size.height/2 - 3}
              width={size.width + 6}
              height={size.height + 6}
              fill={enemyColor}
              opacity={heavyPulse * 0.3}
              rx="3"
            />
            <Rect
              x={-size.width/2}
              y={-size.height/2}
              width={size.width}
              height={size.height}
              fill={enemyColor}
              stroke="#ffffff"
              strokeWidth="2"
              opacity={damageFlash}
              transform={`scale(${heavyPulse})`}
            />
          </G>
        );
        break;
        
      case 'boss':
        enemyColor = "#ff0088";
        enemyShape = (
          <G>
            <Rect
              x={-size.width/2}
              y={-size.height/2}
              width={size.width}
              height={size.height}
              fill={enemyColor}
              stroke="#ffffff"
              strokeWidth="3"
            />
            <Circle cx="-15" cy="-10" r="5" fill="#ffff00" />
            <Circle cx="15" cy="-10" r="5" fill="#ffff00" />
            <Rect x="-10" y="10" width="20" height="5" fill="#ffffff" />
          </G>
        );
        break;
        
      default:
        enemyShape = (
          <Circle
            cx="0"
            cy="0"
            r={size.width/2}
            fill={enemyColor}
            stroke="#ffffff"
            strokeWidth="1"
          />
        );
    }
    
    return (
      <G key={`enemy_${enemy.id}`} transform={`translate(${position.x}, ${position.y}) rotate(${rotation * 180 / Math.PI})`}>
        {enemyShape}
        
        {/* Health bar for bosses and heavy enemies */}
        {(enemyType === 'boss' || enemyType === 'heavy') && (
          <G>
            <Rect
              x={-size.width/2}
              y={-size.height/2 - 8}
              width={size.width}
              height="2"
              fill="#333333"
            />
            <Rect
              x={-size.width/2}
              y={-size.height/2 - 8}
              width={size.width * healthPercentage}
              height="2"
              fill={healthPercentage > 0.5 ? "#00ff00" : healthPercentage > 0.25 ? "#ffff00" : "#ff0000"}
            />
          </G>
        )}
      </G>
    );
  };

  const renderBullet = (bullet: Bullet, index: number) => {
    const { position, size, bulletType } = bullet;
    
    let bulletColor = "#ffffff";
    let bulletShape;
    
    if (bulletType.startsWith('player')) {
      bulletColor = "#00ffff";
      bulletShape = (
        <Rect
          x={-size.width/2}
          y={-size.height/2}
          width={size.width}
          height={size.height}
          fill={bulletColor}
          rx="2"
        />
      );
    } else {
      bulletColor = "#ff4400";
      bulletShape = (
        <Circle
          cx="0"
          cy="0"
          r={size.width/2}
          fill={bulletColor}
        />
      );
    }
    
    return (
      <G key={`bullet_${bullet.id}`} transform={`translate(${position.x}, ${position.y})`}>
        {bulletShape}
        {/* Bullet trail effect */}
        <Rect
          x={-1}
          y={size.height/2}
          width="2"
          height="10"
          fill={bulletColor}
          opacity="0.5"
        />
      </G>
    );
  };

  const renderPowerUp = (powerUp: PowerUp, index: number) => {
    const { position, size, powerUpType } = powerUp;
    
    let powerUpColor = "#ffff00";
    let powerUpIcon;
    
    switch (powerUpType) {
      case 'health':
        powerUpColor = "#00ff00";
        powerUpIcon = (
          <G>
            <Rect x="-2" y="-8" width="4" height="16" fill="#ffffff" />
            <Rect x="-8" y="-2" width="16" height="4" fill="#ffffff" />
          </G>
        );
        break;
        
      case 'weaponUpgrade':
        powerUpColor = "#ff8800";
        powerUpIcon = (
          <Polygon
            points="0,-8 -6,8 6,8"
            fill="#ffffff"
          />
        );
        break;
        
      case 'shield':
        powerUpColor = "#00ffff";
        powerUpIcon = (
          <Circle
            cx="0"
            cy="0"
            r="8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
          />
        );
        break;
        
      case 'speedBoost':
        powerUpColor = "#ffff00";
        powerUpIcon = (
          <G>
            <Polygon points="-8,0 0,-8 8,0 0,8" fill="#ffffff" />
            <Polygon points="-4,0 0,-4 4,0 0,4" fill={powerUpColor} />
          </G>
        );
        break;
        
      case 'scoreMultiplier':
        powerUpColor = "#ff00ff";
        powerUpIcon = (
          <G>
            <Circle cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="2" />
            <Rect x="-1" y="-6" width="2" height="8" fill="#ffffff" />
            <Rect x="-1" y="2" width="2" height="2" fill="#ffffff" />
          </G>
        );
        break;
        
      default:
        powerUpIcon = (
          <Circle cx="0" cy="0" r="6" fill="#ffffff" />
        );
    }
    
    return (
      <G key={`powerup_${powerUp.id}`} transform={`translate(${position.x}, ${position.y})`}>
        {/* Outer glow */}
        <Circle
          cx="0"
          cy="0"
          r={size.width/2 + 5}
          fill={powerUpColor}
          opacity="0.3"
        />
        
        {/* Main power-up body */}
        <Circle
          cx="0"
          cy="0"
          r={size.width/2}
          fill={powerUpColor}
          stroke="#ffffff"
          strokeWidth="1"
        />
        
        {/* Icon */}
        {powerUpIcon}
      </G>
    );
  };

  const renderExplosion = (explosion: Explosion, index: number) => {
    const { position, size, duration, currentFrame } = explosion;
    const progress = currentFrame / duration;
    const explosionSize = size * (1 + progress * 2);
    const opacity = 1 - progress;
    
    return (
      <G key={`explosion_${explosion.id}`} transform={`translate(${position.x}, ${position.y})`}>
        {/* Outer explosion ring */}
        <Circle
          cx="0"
          cy="0"
          r={explosionSize}
          fill="#ff4400"
          opacity={opacity * 0.6}
        />
        
        {/* Inner explosion core */}
        <Circle
          cx="0"
          cy="0"
          r={explosionSize * 0.6}
          fill="#ffff00"
          opacity={opacity * 0.8}
        />
        
        {/* Center bright spot */}
        <Circle
          cx="0"
          cy="0"
          r={explosionSize * 0.3}
          fill="#ffffff"
          opacity={opacity}
        />
      </G>
    );
  };

  const renderStarfield = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * screenWidth;
      const y = (Math.random() * screenHeight + (Date.now() * 0.05) % screenHeight) % screenHeight;
      const size = Math.random() * 2 + 0.5;
      const opacity = Math.random() * 0.8 + 0.2;
      
      stars.push(
        <Circle
          key={`star_${i}`}
          cx={x}
          cy={y}
          r={size}
          fill="#ffffff"
          opacity={opacity}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={screenHeight} style={styles.svg}>
        <Defs>
          <LinearGradient id="spaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#000033" stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background */}
        <Rect
          width={screenWidth}
          height={screenHeight}
          fill="url(#spaceGradient)"
        />
        
        {/* Starfield */}
        {renderStarfield()}
        
        {/* Game objects */}
        {gameState.explosions.map(renderExplosion)}
        {gameState.powerUps.map(renderPowerUp)}
        {gameState.bullets.map(renderBullet)}
        {gameState.enemies.map(renderEnemy)}
        {gameState.players.map(renderPlayer)}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});