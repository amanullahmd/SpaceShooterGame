import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameState } from '../types/GameTypes';
import { LinearGradient } from 'expo-linear-gradient';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
  roomId?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, onPause, roomId }) => {
  const localPlayer = gameState.players.find(p => p.isLocalPlayer);
  
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getHealthBarColor = (healthPercentage: number): string[] => {
    if (healthPercentage > 0.6) {
      return ['#00ff00', '#88ff88'];
    } else if (healthPercentage > 0.3) {
      return ['#ffff00', '#ffff88'];
    } else {
      return ['#ff0000', '#ff8888'];
    }
  };

  const renderHealthBar = () => {
    if (!localPlayer) return null;
    
    const healthPercentage = localPlayer.health / localPlayer.maxHealth;
    const healthColors = getHealthBarColor(healthPercentage);
    
    return (
      <View style={styles.healthBarContainer}>
        <Text style={styles.healthLabel}>Health</Text>
        <View style={styles.healthBarBackground}>
          <LinearGradient
            colors={healthColors as [string, string]}
            style={[styles.healthBarFill, { width: `${healthPercentage * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.healthText}>
          {localPlayer.health}/{localPlayer.maxHealth}
        </Text>
      </View>
    );
  };

  const renderLivesIndicator = () => {
    if (!localPlayer) return null;
    
    const lives = [];
    for (let i = 0; i < localPlayer.lives; i++) {
      lives.push(
        <View key={i} style={styles.lifeIndicator} />
      );
    }
    
    return (
      <View style={styles.livesContainer}>
        <Text style={styles.livesLabel}>Lives</Text>
        <View style={styles.livesIndicators}>
          {lives}
        </View>
      </View>
    );
  };

  const renderWeaponInfo = () => {
    if (!localPlayer) return null;
    
    return (
      <View style={styles.weaponContainer}>
        <Text style={styles.weaponLabel}>Weapon</Text>
        <Text style={styles.weaponType}>
          {localPlayer.weaponType.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderPowerUps = () => {
    if (!localPlayer || localPlayer.powerUps.length === 0) return null;
    
    return (
      <View style={styles.powerUpsContainer}>
        <Text style={styles.powerUpsLabel}>Active Power-ups</Text>
        <View style={styles.powerUpsList}>
          {localPlayer.powerUps.map((powerUp, index) => (
            <View key={index} style={styles.powerUpItem}>
              <Text style={styles.powerUpText}>
                {powerUp.powerUpType.toUpperCase()}
              </Text>
              {powerUp.duration > 0 && (
                <Text style={styles.powerUpDuration}>
                  {Math.ceil(powerUp.duration / 1000)}s
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMultiplayerInfo = () => {
    if (!gameState.isMultiplayer) return null;
    
    const activePlayers = gameState.players.filter(p => p.isActive);
    
    return (
      <View style={styles.multiplayerContainer}>
        <Text style={styles.multiplayerLabel}>Multiplayer</Text>
        {roomId && (
          <Text style={styles.roomId}>Room: {roomId.slice(-6)}</Text>
        )}
        <Text style={styles.playerCount}>
          Players: {activePlayers.length}
        </Text>
        
        {/* Player list */}
        <View style={styles.playersList}>
          {activePlayers.slice(0, 4).map((player, index) => (
            <View key={player.playerId} style={styles.playerItem}>
              <Text style={[
                styles.playerName,
                player.isLocalPlayer && styles.localPlayerName
              ]}>
                {player.playerName}
              </Text>
              <Text style={styles.playerScore}>
                {player.score}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWaveInfo = () => {
    return (
      <View style={styles.waveContainer}>
        <Text style={styles.waveLabel}>Wave</Text>
        <Text style={styles.waveNumber}>{gameState.level}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.topHUD}>
        <View style={styles.leftSection}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {gameState.score.toLocaleString()}
            </Text>
          </View>
          
          {renderWaveInfo()}
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Time</Text>
            <Text style={styles.timeValue}>
              {formatTime(gameState.timeElapsed)}
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
            <Text style={styles.pauseButtonText}>⏸</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Bottom HUD */}
      <View style={styles.bottomHUD}>
        <View style={styles.leftBottomSection}>
          {renderHealthBar()}
          {renderLivesIndicator()}
          {renderWeaponInfo()}
        </View>
        
        <View style={styles.rightBottomSection}>
          {renderPowerUps()}
          {renderMultiplayerInfo()}
        </View>
      </View>
      
      {/* Touch instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Touch and drag to move • Touch to shoot • ESC to pause/quit
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    marginRight: 20,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreValue: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waveContainer: {
    marginRight: 20,
    alignItems: 'center',
  },
  waveLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waveNumber: {
    color: '#ffff00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeValue: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomHUD: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  leftBottomSection: {
    flex: 1,
  },
  rightBottomSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  healthBarContainer: {
    marginBottom: 10,
  },
  healthLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  healthBarBackground: {
    width: 150,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  healthText: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  livesContainer: {
    marginBottom: 10,
  },
  livesLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  livesIndicators: {
    flexDirection: 'row',
  },
  lifeIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#ff0000',
    marginRight: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  weaponContainer: {
    marginBottom: 10,
  },
  weaponLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  weaponType: {
    color: '#ff8800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  powerUpsContainer: {
    marginBottom: 10,
  },
  powerUpsLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  powerUpsList: {
    alignItems: 'flex-end',
  },
  powerUpItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#ffff00',
  },
  powerUpText: {
    color: '#ffff00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  powerUpDuration: {
    color: '#ffffff',
    fontSize: 8,
    textAlign: 'center',
  },
  multiplayerContainer: {
    alignItems: 'flex-end',
  },
  multiplayerLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roomId: {
    color: '#00ffff',
    fontSize: 10,
    marginBottom: 3,
  },
  playerCount: {
    color: '#ffffff',
    fontSize: 10,
    marginBottom: 5,
  },
  playersList: {
    alignItems: 'flex-end',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 10,
    marginRight: 10,
  },
  localPlayerName: {
    color: '#00ff00',
    fontWeight: 'bold',
  },
  playerScore: {
    color: '#ffff00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});