import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameOverScreenProps {
  visible: boolean;
  gameStats: {
    score: number;
    wave: number;
    timeElapsed: number;
    enemiesKilled: number;
    powerUpsCollected: number;
    accuracy: number;
    isNewHighScore: boolean;
  };
  isMultiplayer: boolean;
  multiplayerResults?: {
    playerRank: number;
    totalPlayers: number;
    playerScores: Array<{ name: string; score: number }>;
  };
  onRestart: () => void;
  onMainMenu: () => void;
  onShare: () => void;
}

interface HighScore {
  score: number;
  wave: number;
  date: string;
  timeElapsed: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  visible,
  gameStats,
  isMultiplayer,
  multiplayerResults,
  onRestart,
  onMainMenu,
  onShare,
}) => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [scoreAnimatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadHighScores();
      startAnimations();
      if (gameStats.isNewHighScore && !isMultiplayer) {
        saveHighScore();
      }
    }
  }, [visible]);

  const startAnimations = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnimatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const loadHighScores = async () => {
    try {
      const stored = await AsyncStorage.getItem('highScores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load high scores:', error);
    }
  };

  const saveHighScore = async () => {
    try {
      const newScore: HighScore = {
        score: gameStats.score,
        wave: gameStats.wave,
        date: new Date().toISOString(),
        timeElapsed: gameStats.timeElapsed,
      };
      
      const updatedScores = [...highScores, newScore]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Keep top 10
      
      await AsyncStorage.setItem('highScores', JSON.stringify(updatedScores));
      setHighScores(updatedScores);
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const renderStarfield = () => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * screenWidth;
      const y = Math.random() * screenHeight;
      const size = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.8 + 0.2;
      
      stars.push(
        <View
          key={i}
          style={[
            styles.star,
            {
              left: x,
              top: y,
              width: size,
              height: size,
              opacity,
            },
          ]}
        />
      );
    }
    return stars;
  };

  const renderGameStats = () => {
    return (
      <Modal
        visible={showStats}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statsModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Detailed Statistics</Text>
              
              <View style={styles.detailedStatsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Final Score:</Text>
                  <Text style={styles.statRowValue}>{gameStats.score.toLocaleString()}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Waves Completed:</Text>
                  <Text style={styles.statRowValue}>{gameStats.wave}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Time Survived:</Text>
                  <Text style={styles.statRowValue}>{formatTime(gameStats.timeElapsed)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Enemies Defeated:</Text>
                  <Text style={styles.statRowValue}>{gameStats.enemiesKilled}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Power-ups Collected:</Text>
                  <Text style={styles.statRowValue}>{gameStats.powerUpsCollected}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Accuracy:</Text>
                  <Text style={styles.statRowValue}>{gameStats.accuracy.toFixed(1)}%</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Score per Minute:</Text>
                  <Text style={styles.statRowValue}>
                    {Math.round((gameStats.score / gameStats.timeElapsed) * 60).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Enemies per Wave:</Text>
                  <Text style={styles.statRowValue}>
                    {(gameStats.enemiesKilled / Math.max(gameStats.wave, 1)).toFixed(1)}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLeaderboard = () => {
    return (
      <Modal
        visible={showLeaderboard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.modalTitle}>
              {isMultiplayer ? 'Match Results' : 'High Scores'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {isMultiplayer && multiplayerResults ? (
                <View>
                  <Text style={styles.rankText}>
                    You finished {multiplayerResults.playerRank}{getRankSuffix(multiplayerResults.playerRank)} out of {multiplayerResults.totalPlayers} players!
                  </Text>
                  
                  {multiplayerResults.playerScores.map((player, index) => (
                    <View key={index} style={[
                      styles.leaderboardItem,
                      index === multiplayerResults.playerRank - 1 && styles.currentPlayerItem
                    ]}>
                      <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                      <Text style={styles.leaderboardName}>{player.name}</Text>
                      <Text style={styles.leaderboardScore}>{player.score.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  {highScores.length === 0 ? (
                    <Text style={styles.noScoresText}>No high scores yet!</Text>
                  ) : (
                    highScores.map((score, index) => (
                      <View key={index} style={[
                        styles.leaderboardItem,
                        score.score === gameStats.score && styles.currentPlayerItem
                      ]}>
                        <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                        <View style={styles.scoreDetails}>
                          <Text style={styles.leaderboardScore}>{score.score.toLocaleString()}</Text>
                          <Text style={styles.scoreSubtext}>
                            Wave {score.wave} • {formatDate(score.date)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowLeaderboard(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const animatedScore = scoreAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, gameStats.score],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Animated starfield background */}
        <View style={styles.starfield}>
          {renderStarfield()}
        </View>
        
        {/* Background gradient */}
        <LinearGradient
          colors={['#330000', '#000033', '#000000']}
          style={styles.gradient}
        />
        
        <Animated.View style={[
          styles.content,
          {
            opacity: animatedValue,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.gameOverTitle}>GAME OVER</Text>
            {gameStats.isNewHighScore && !isMultiplayer && (
              <Text style={styles.newHighScoreText}>🎉 NEW HIGH SCORE! 🎉</Text>
            )}
            {isMultiplayer && multiplayerResults && (
              <Text style={styles.multiplayerRankText}>
                Rank: {multiplayerResults.playerRank}/{multiplayerResults.totalPlayers}
              </Text>
            )}
          </View>
          
          {/* Main Stats */}
          <View style={styles.mainStatsContainer}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>FINAL SCORE</Text>
              <Animated.Text style={styles.scoreValue}>
                {animatedScore.interpolate({
                  inputRange: [0, gameStats.score],
                  outputRange: ['0', gameStats.score.toLocaleString()],
                  extrapolate: 'clamp',
                })}
              </Animated.Text>
            </View>
            
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{gameStats.wave}</Text>
                <Text style={styles.quickStatLabel}>Waves</Text>
              </View>
              
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{formatTime(gameStats.timeElapsed)}</Text>
                <Text style={styles.quickStatLabel}>Time</Text>
              </View>
              
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{gameStats.enemiesKilled}</Text>
                <Text style={styles.quickStatLabel}>Enemies</Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowStats(true)}
            >
              <LinearGradient
                colors={['#0088ff', '#004488']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>📊 View Stats</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowLeaderboard(true)}
            >
              <LinearGradient
                colors={['#ffaa00', '#885500']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isMultiplayer ? '🏆 Match Results' : '🏆 High Scores'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onShare}
            >
              <LinearGradient
                colors={['#00ff88', '#008844']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>📤 Share Score</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Main Menu Buttons */}
          <View style={styles.menuButtonContainer}>
            {!isMultiplayer && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onRestart}
              >
                <LinearGradient
                  colors={['#00ff00', '#008800']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.menuButtonText}>🔄 Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMainMenu}
            >
              <LinearGradient
                colors={['#ff6600', '#883300']}
                style={styles.buttonGradient}
              >
                <Text style={styles.menuButtonText}>🏠 Main Menu</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Modals */}
        {renderGameStats()}
        {renderLeaderboard()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  starfield: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  gradient: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ff4444',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  newHighScoreText: {
    fontSize: 18,
    color: '#ffff00',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  multiplayerRankText: {
    fontSize: 16,
    color: '#00ffff',
    marginTop: 10,
    textAlign: 'center',
  },
  mainStatsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  actionButton: {
    width: '80%',
    height: 50,
    marginBottom: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  menuButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuButton: {
    width: '80%',
    height: 55,
    marginBottom: 12,
    borderRadius: 27.5,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  leaderboardModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailedStatsContainer: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRowLabel: {
    color: '#cccccc',
    fontSize: 14,
  },
  statRowValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankText: {
    color: '#00ffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  currentPlayerItem: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  leaderboardRank: {
    color: '#ffaa00',
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
  },
  leaderboardName: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  leaderboardScore: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 10,
  },
  scoreSubtext: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  noScoresText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeModalButton: {
    backgroundColor: '#00ff00',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});