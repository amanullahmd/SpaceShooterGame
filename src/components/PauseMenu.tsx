import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSettings: () => void;
  onQuit?: () => void;
  isMultiplayer: boolean;
  gameStats?: {
    score: number;
    wave: number;
    timeElapsed: number;
    enemiesKilled: number;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PauseMenu: React.FC<PauseMenuProps> = ({
  visible,
  onResume,
  onRestart,
  onMainMenu,
  onSettings,
  onQuit,
  isMultiplayer,
  gameStats,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGameStats = () => {
    if (!gameStats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Current Game Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{gameStats.score.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{gameStats.wave}</Text>
            <Text style={styles.statLabel}>Wave</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(gameStats.timeElapsed)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{gameStats.enemiesKilled}</Text>
            <Text style={styles.statLabel}>Enemies</Text>
          </View>
        </View>
      </View>
    );
  };

  const handleQuitPress = () => {
    Alert.alert(
      'Quit Game',
      'Are you sure you want to quit the current game? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: onQuit },
      ]
    );
  };

  const renderStarfield = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const left = Math.random() * screenWidth;
      const top = Math.random() * screenHeight;
      const size = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.8 + 0.2;
      
      stars.push(
        <View
          key={i}
          style={[
            styles.star,
            {
              left,
              top,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Animated starfield background */}
        <View style={styles.starfield}>
          {renderStarfield()}
        </View>
        
        {/* Blur effect */}
        <BlurView intensity={20} style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(0, 0, 50, 0.8)', 'rgba(0, 0, 0, 0.9)']}
            style={styles.gradient}
          />
        </BlurView>
        
        <View style={styles.container}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>GAME PAUSED</Text>
            <Text style={styles.subtitle}>
              {isMultiplayer ? 'Multiplayer Session' : 'Single Player'}
            </Text>
          </View>
          
          {/* Game Stats */}
          {renderGameStats()}
          
          {/* Menu Buttons */}
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onResume}
            >
              <LinearGradient
                colors={['#00ff00', '#008800']}
                style={styles.buttonGradient}
              >
                <Text style={styles.menuButtonText}>▶️ Resume Game</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {!isMultiplayer && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onRestart}
              >
                <LinearGradient
                  colors={['#ffff00', '#888800']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.menuButtonText}>🔄 Restart Game</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onSettings}
            >
              <LinearGradient
                colors={['#0088ff', '#004488']}
                style={styles.buttonGradient}
              >
                <Text style={styles.menuButtonText}>⚙️ Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMainMenu}
            >
              <LinearGradient
                colors={['#ff8800', '#884400']}
                style={styles.buttonGradient}
              >
                <Text style={styles.menuButtonText}>🏠 Main Menu</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {onQuit && (
               <TouchableOpacity
                 style={styles.menuButton}
                 onPress={handleQuitPress}
               >
                 <LinearGradient
                   colors={['#ff4444', '#aa2222']}
                   style={styles.buttonGradient}
                 >
                   <Text style={styles.menuButtonText}>❌ Quit Game</Text>
                 </LinearGradient>
               </TouchableOpacity>
             )}
          </View>
          
          {/* Warning for multiplayer */}
          {isMultiplayer && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ In multiplayer mode, the game continues for other players
              </Text>
            </View>
          )}
          
          {/* Quick resume hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              💡 Tip: Touch anywhere outside this menu to resume quickly
            </Text>
          </View>
        </View>
      </View>
      
      {/* Quick resume touch area */}
      <TouchableOpacity
        style={styles.quickResumeArea}
        onPress={onResume}
        activeOpacity={1}
      >
        <View />
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  starfield: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  blurContainer: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 5,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
  },
  menuContainer: {
    width: '85%',
    alignItems: 'center',
  },
  menuButton: {
    width: '100%',
    height: 55,
    marginBottom: 12,
    borderRadius: 27.5,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 27.5,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.5)',
  },
  warningText: {
    color: '#ffaa00',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  hintContainer: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  hintText: {
    color: '#00ffff',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickResumeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});