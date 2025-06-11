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
        const bossRotation = animTime * 2;
        const bossPulse = 0.9 + 0.1 * Math.sin(animTime * 3);
        const energyField = 0.3 + 0.2 * Math.sin(animTime * 5);
        const eyeGlow = 0.7 + 0.3 * Math.sin(animTime * 4);
        enemyShape = (
          <G>
            {/* Energy field */}
            <Rect
              x={-size.width/2 - 8}
              y={-size.height/2 - 8}
              width={size.width + 16}
              height={size.height + 16}
              fill="none"
              stroke={enemyColor}
              strokeWidth="2"
              opacity={energyField}
              strokeDasharray="8,4"
              transform={`rotate(${bossRotation * 180 / Math.PI})`}
              rx="4"
            />
            {/* Outer glow */}
            <Rect
              x={-size.width/2 - 4}
              y={-size.height/2 - 4}
              width={size.width + 8}
              height={size.height + 8}
              fill={enemyColor}
              opacity={bossPulse * 0.2}
              rx="2"
            />
            {/* Main body */}
            <Rect
              x={-size.width/2}
              y={-size.height/2}
              width={size.width}
              height={size.height}
              fill={enemyColor}
              stroke="#ffffff"
              strokeWidth="3"
              opacity={damageFlash}
              transform={`scale(${bossPulse})`}
            />
            {/* Animated eyes */}
            <Circle 
              cx="-15" 
              cy="-10" 
              r="5" 
              fill="#ffff00" 
              opacity={eyeGlow}
            />
            <Circle 
              cx="15" 
              cy="-10" 
              r="5" 
              fill="#ffff00" 
              opacity={eyeGlow}
            />
            {/* Eye pupils that track */}
            <Circle 
              cx={-15 + Math.sin(animTime * 2) * 2} 
              cy={-10 + Math.cos(animTime * 1.5) * 1} 
              r="2" 
              fill="#ff0000" 
            />
            <Circle 
              cx={15 + Math.sin(animTime * 2) * 2} 
              cy={-10 + Math.cos(animTime * 1.5) * 1} 
              r="2" 
              fill="#ff0000" 
            />
            {/* Animated mouth */}
            <Rect 
              x="-10" 
              y="10" 
              width={20 + Math.sin(animTime * 6) * 4} 
              height="5" 
              fill="#ffffff" 
              opacity={damageFlash}
            />
            {/* Weapon systems */}
            <G transform={`rotate(${-bossRotation * 90 / Math.PI})`}>
              {[-1, 1].map((side, i) => (
                <G key={`weapon_${i}`}>
                  <Rect
                    x={side * size.width/3}
                    y="-2"
                    width="8"
                    height="4"
                    fill="#ff4444"
                    opacity={0.8 + 0.2 * Math.sin(animTime * 8 + i * Math.PI)}
                  />
                  <Circle
                    cx={side * size.width/3 + 4}
                    cy="0"
                    r="2"
                    fill="#ffffff"
                    opacity={0.6 + 0.4 * Math.sin(animTime * 10 + i * Math.PI)}
                  />
                </G>
              ))}
            </G>
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
    const { position, size, bulletType, isPlayerBullet } = bullet;
    const animTime = (currentTime * 0.02 + index) % (Math.PI * 2);
    const scale = bullet.scale || 1;
    const opacity = bullet.opacity || 1;
    
    let bulletColor = isPlayerBullet ? "#00ff00" : "#ff0000";
    let bulletShape;
    let trailEffect = [];
    
    // Create trail effect
    const trailLength = isPlayerBullet ? 5 : 3;
    for (let i = 0; i < trailLength; i++) {
      const trailOpacity = (1 - i / trailLength) * 0.4;
      const trailY = i * (isPlayerBullet ? -3 : 3);
      trailEffect.push(
        <Circle
          key={`trail_${i}`}
          cx="0"
          cy={trailY}
          r={size.width/2 * (1 - i * 0.1)}
          fill={bulletColor}
          opacity={trailOpacity}
        />
      );
    }
    
    switch (bulletType) {
      case 'normal':
        const normalPulse = 0.9 + 0.1 * Math.sin(animTime * 6);
        bulletShape = (
          <G>
            {trailEffect}
            <Rect
              x={-size.width/2}
              y={-size.height/2}
              width={size.width}
              height={size.height}
              fill={bulletColor}
              rx="2"
              opacity={opacity}
              transform={`scale(${normalPulse * scale})`}
            />
            {/* Core glow */}
            <Rect
              x={-size.width/4}
              y={-size.height/4}
              width={size.width/2}
              height={size.height/2}
              fill="#ffffff"
              rx="1"
              opacity={normalPulse * 0.6}
            />
          </G>
        );
        break;
        
      case 'laser':
        const laserFlicker = 0.8 + 0.2 * Math.sin(animTime * 8);
        bulletShape = (
          <G>
            {trailEffect}
            {/* Outer glow */}
            <Rect
              x={-size.width/2 - 2}
              y={-size.height/2 - 2}
              width={size.width + 4}
              height={size.height + 4}
              fill={bulletColor}
              opacity={laserFlicker * 0.3}
            />
            <Rect
              x={-size.width/2}
              y={-size.height/2}
              width={size.width}
              height={size.height}
              fill={bulletColor}
              stroke="#ffffff"
              strokeWidth="1"
              opacity={opacity * laserFlicker}
              transform={`scale(${scale})`}
            />
          </G>
        );
        break;
        
      case 'plasma':
        const plasmaPulse = 0.7 + 0.3 * Math.sin(animTime * 4);
        const plasmaRotation = animTime * 3;
        bulletShape = (
          <G>
            {trailEffect}
            {/* Energy field */}
            <Circle
              cx="0"
              cy="0"
              r={size.width/2 + 3}
              fill="none"
              stroke={bulletColor}
              strokeWidth="1"
              opacity={plasmaPulse * 0.4}
              strokeDasharray="2,2"
              transform={`rotate(${plasmaRotation * 180 / Math.PI})`}
            />
            {/* Outer glow */}
            <Circle
              cx="0"
              cy="0"
              r={size.width/2 + 1}
              fill={bulletColor}
              opacity={plasmaPulse * 0.3}
            />
            <Circle
              cx="0"
              cy="0"
              r={size.width/2}
              fill={bulletColor}
              stroke="#ffffff"
              strokeWidth="1"
              opacity={opacity}
              transform={`scale(${plasmaPulse * scale})`}
            />
            {/* Core */}
            <Circle
              cx="0"
              cy="0"
              r={size.width/4}
              fill="#ffffff"
              opacity={plasmaPulse * 0.8}
            />
          </G>
        );
        break;
        
      default:
        const defaultPulse = 0.8 + 0.2 * Math.sin(animTime * 5);
        bulletShape = (
          <G>
            {trailEffect}
            <Circle
              cx="0"
              cy="0"
              r={size.width/2}
              fill={bulletColor}
              opacity={opacity * defaultPulse}
              transform={`scale(${scale})`}
            />
          </G>
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
    const animTime = (currentTime * 0.015 + index) % (Math.PI * 2);
    const scale = powerUp.scale || 1;
    const opacity = powerUp.opacity || 1;
    
    // Floating animation
    const floatY = Math.sin(animTime * 2) * 3;
    const rotation = animTime * 30; // Slow rotation
    const pulse = 0.8 + 0.2 * Math.sin(animTime * 4);
    const glow = 0.3 + 0.2 * Math.sin(animTime * 6);
    
    let powerUpColor = "#ffff00";
    let powerUpIcon;
    let glowEffect;
    
    switch (powerUpType) {
      case 'health':
        powerUpColor = "#00ff00";
        glowEffect = (
          <G>
            <Circle cx="0" cy="0" r="15" fill={powerUpColor} opacity={glow * 0.2} />
            <Circle cx="0" cy="0" r="12" fill={powerUpColor} opacity={glow * 0.3} />
          </G>
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale})`}>
            <Rect x="-8" y="-2" width="16" height="4" fill="#ffffff" rx="2" />
            <Rect x="-2" y="-8" width="4" height="16" fill="#ffffff" rx="2" />
            {/* Inner glow */}
            <Rect x="-6" y="-1" width="12" height="2" fill={powerUpColor} opacity="0.6" rx="1" />
            <Rect x="-1" y="-6" width="2" height="12" fill={powerUpColor} opacity="0.6" rx="1" />
          </G>
        );
        break;
        
      case 'weaponUpgrade':
        powerUpColor = "#ff8800";
        glowEffect = (
          <G>
            <Polygon points="0,-15 -12,12 12,12" fill={powerUpColor} opacity={glow * 0.2} />
            <Polygon points="0,-12 -10,10 10,10" fill={powerUpColor} opacity={glow * 0.3} />
          </G>
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale})`}>
            <Polygon
              points="0,-8 -6,8 6,8"
              fill="#ffffff"
            />
            {/* Inner triangle */}
            <Polygon
              points="0,-4 -3,4 3,4"
              fill={powerUpColor}
              opacity="0.7"
            />
            {/* Sparkle effects */}
            {[0, 120, 240].map((angle, i) => {
              const x = Math.cos((angle + rotation) * Math.PI / 180) * 6;
              const y = Math.sin((angle + rotation) * Math.PI / 180) * 6;
              return (
                <Circle
                  key={`sparkle_${i}`}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="#ffffff"
                  opacity={0.5 + 0.5 * Math.sin(animTime * 8 + i)}
                />
              );
            })}
          </G>
        );
        break;
        
      case 'shield':
        powerUpColor = "#00ffff";
        glowEffect = (
          <G>
            <Circle cx="0" cy="0" r="15" fill={powerUpColor} opacity={glow * 0.2} />
            <Circle cx="0" cy="0" r="12" fill={powerUpColor} opacity={glow * 0.3} />
          </G>
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale})`}>
            <Circle
              cx="0"
              cy="0"
              r="10"
              fill="none"
              stroke={powerUpColor}
              strokeWidth="2"
              strokeDasharray="4,2"
              transform={`rotate(${rotation})`}
            />
            <Circle
              cx="0"
              cy="0"
              r="8"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <Circle
              cx="0"
              cy="0"
              r="5"
              fill={powerUpColor}
              opacity="0.3"
            />
          </G>
        );
        break;
        
      case 'speedBoost':
        powerUpColor = "#ffff00";
        glowEffect = (
          <G>
            <Polygon points="-12,0 0,-12 12,0 0,12" fill={powerUpColor} opacity={glow * 0.2} />
            <Polygon points="-10,0 0,-10 10,0 0,10" fill={powerUpColor} opacity={glow * 0.3} />
          </G>
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale}) rotate(${rotation})`}>
            <Polygon points="-8,0 0,-8 8,0 0,8" fill="#ffffff" />
            <Polygon points="-4,0 0,-4 4,0 0,4" fill={powerUpColor} />
            {/* Speed lines */}
            {[-1, 1].map((dir, i) => (
              <G key={`speed_line_${i}`}>
                <Rect
                  x={dir * 12}
                  y="-1"
                  width="4"
                  height="2"
                  fill={powerUpColor}
                  opacity={0.6 + 0.4 * Math.sin(animTime * 10 + i * Math.PI)}
                />
                <Rect
                  x={dir * 16}
                  y="-0.5"
                  width="2"
                  height="1"
                  fill={powerUpColor}
                  opacity={0.4 + 0.4 * Math.sin(animTime * 12 + i * Math.PI)}
                />
              </G>
            ))}
          </G>
        );
        break;
        
      case 'scoreMultiplier':
        powerUpColor = "#ff00ff";
        glowEffect = (
          <G>
            <Circle cx="0" cy="0" r="15" fill={powerUpColor} opacity={glow * 0.2} />
            <Circle cx="0" cy="0" r="12" fill={powerUpColor} opacity={glow * 0.3} />
          </G>
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale})`}>
            <Circle cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="2" />
            <Rect x="-1" y="-6" width="2" height="8" fill="#ffffff" />
            <Rect x="-1" y="2" width="2" height="2" fill="#ffffff" />
            {/* Coin-like ridges */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45 + rotation) * Math.PI / 180;
              const x1 = Math.cos(angle) * 7;
              const y1 = Math.sin(angle) * 7;
              const x2 = Math.cos(angle) * 9;
              const y2 = Math.sin(angle) * 9;
              return (
                <Rect
                  key={`ridge_${i}`}
                  x={x1}
                  y={y1}
                  width="1"
                  height="2"
                  fill="#ffffff"
                  opacity="0.5"
                  transform={`rotate(${angle * 180 / Math.PI})`}
                />
              );
            })}
          </G>
        );
        break;
        
      default:
        glowEffect = (
          <Circle cx="0" cy="0" r="12" fill={powerUpColor} opacity={glow * 0.3} />
        );
        powerUpIcon = (
          <G transform={`scale(${pulse * scale})`}>
            <Circle cx="0" cy="0" r="6" fill="#ffffff" />
          </G>
        );
    }
    
    return (
      <G key={`powerup_${powerUp.id}`} transform={`translate(${position.x}, ${position.y + floatY})`}>
        {/* Glow effects */}
        {glowEffect}
        
        {/* Main power-up body */}
        <Circle
          cx="0"
          cy="0"
          r={size.width/2}
          fill={powerUpColor}
          stroke="#ffffff"
          strokeWidth="1"
          opacity={opacity}
          transform={`scale(${pulse})`}
        />
        
        {/* Icon */}
        {powerUpIcon}
      </G>
    );
  };

  const renderExplosion = (explosion: Explosion, index: number) => {
    const { position, size, animationProgress } = explosion;
    const opacity = 1 - animationProgress;
    const scale = 0.3 + animationProgress * 2;
    const animTime = (currentTime * 0.05 + index) % (Math.PI * 2);
    
    // Create multiple explosion rings with different timings
    const rings = [];
    const numRings = 4;
    
    for (let i = 0; i < numRings; i++) {
      const ringProgress = Math.max(0, Math.min(1, (animationProgress * numRings) - i));
      const ringOpacity = (1 - ringProgress) * opacity;
      const ringScale = 0.2 + ringProgress * (1.5 + i * 0.3);
      
      if (ringOpacity > 0) {
        const colors = ["#ff0000", "#ff4400", "#ff8800", "#ffff00"];
        rings.push(
          <Circle
            key={`ring_${i}`}
            cx="0"
            cy="0"
            r={(size.width/2) * ringScale}
            fill={colors[i]}
            opacity={ringOpacity}
          />
        );
      }
    }
    
    // Create particle effects
    const particles = [];
    const numParticles = 12;
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const distance = animationProgress * size.width * (0.8 + Math.sin(animTime + i) * 0.3);
      const particleX = Math.cos(angle) * distance;
      const particleY = Math.sin(angle) * distance;
      const particleOpacity = (1 - animationProgress) * (0.6 + 0.4 * Math.sin(animTime * 3 + i));
      const particleSize = (1 - animationProgress) * (2 + Math.sin(animTime * 5 + i) * 1);
      
      if (particleOpacity > 0 && particleSize > 0) {
        particles.push(
          <Circle
            key={`particle_${i}`}
            cx={particleX}
            cy={particleY}
            r={particleSize}
            fill={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffff00" : "#ff8800"}
            opacity={particleOpacity}
          />
        );
      }
    }
    
    // Create shockwave effect
    const shockwaveOpacity = Math.max(0, (1 - animationProgress * 2) * opacity);
    const shockwaveRadius = animationProgress * size.width * 1.5;
    
    return (
      <G key={`explosion_${explosion.id}`} transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
        {/* Shockwave */}
        {shockwaveOpacity > 0 && (
          <Circle
            cx="0"
            cy="0"
            r={shockwaveRadius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity={shockwaveOpacity}
          />
        )}
        
        {/* Main explosion rings */}
        {rings}
        
        {/* Core flash */}
        <Circle
          cx="0"
          cy="0"
          r={size.width/6}
          fill="#ffffff"
          opacity={opacity * (0.8 + 0.2 * Math.sin(animTime * 10))}
        />
        
        {/* Particles */}
        {particles}
        
        {/* Additional sparks */}
        {[...Array(6)].map((_, i) => {
          const sparkAngle = (i / 6) * Math.PI * 2 + animTime;
          const sparkDistance = animationProgress * size.width * 0.6;
          const sparkX = Math.cos(sparkAngle) * sparkDistance;
          const sparkY = Math.sin(sparkAngle) * sparkDistance;
          const sparkOpacity = (1 - animationProgress) * 0.8;
          
          return sparkOpacity > 0 ? (
            <G key={`spark_${i}`}>
              <Circle
                cx={sparkX}
                cy={sparkY}
                r="1"
                fill="#ffffff"
                opacity={sparkOpacity}
              />
              <Circle
                cx={sparkX * 1.2}
                cy={sparkY * 1.2}
                r="0.5"
                fill="#ffff00"
                opacity={sparkOpacity * 0.7}
              />
            </G>
          ) : null;
        })}
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