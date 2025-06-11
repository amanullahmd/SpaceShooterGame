import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DifficultyLevel } from '../types/GameTypes';

interface GameMenuProps {
  onStartSinglePlayer: (difficulty: DifficultyLevel) => void;
  onStartMultiplayer: () => void;
  onExit: () => void;
  isConnectedToServer: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GameMenu: React.FC<GameMenuProps> = ({
  onStartSinglePlayer,
  onStartMultiplayer,
  onExit,
  isConnectedToServer,
}) => {
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSinglePlayerPress = () => {
    setShowDifficultyModal(true);
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setShowDifficultyModal(false);
    onStartSinglePlayer(difficulty);
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

  const renderDifficultyModal = () => {
    const difficulties = [
      {
        level: DifficultyLevel.EASY,
        title: 'Easy',
        description: 'Perfect for beginners\nSlower enemies, more power-ups',
        color: '#00ff00',
      },
      {
        level: DifficultyLevel.MEDIUM,
        title: 'Medium',
        description: 'Balanced gameplay\nStandard enemy speed and spawning',
        color: '#ffff00',
      },
      {
        level: DifficultyLevel.HARD,
        title: 'Hard',
        description: 'For experienced players\nFaster enemies, fewer power-ups',
        color: '#ff8800',
      },
      {
        level: DifficultyLevel.EXPERT,
        title: 'Expert',
        description: 'Ultimate challenge\nVery fast enemies, rare power-ups',
        color: '#ff0000',
      },
    ];

    return (
      <Modal
        visible={showDifficultyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Difficulty</Text>
            
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff.level}
                style={[styles.difficultyButton, { borderColor: diff.color }]}
                onPress={() => handleDifficultySelect(diff.level)}
              >
                <Text style={[styles.difficultyTitle, { color: diff.color }]}>
                  {diff.title}
                </Text>
                <Text style={styles.difficultyDescription}>
                  {diff.description}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDifficultyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderInstructionsModal = () => {
    return (
      <Modal
        visible={showInstructions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.instructionsContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>How to Play</Text>
              
              <View style={styles.instructionSection}>
                <Text style={styles.instructionTitle}>🎮 Controls</Text>
                <Text style={styles.instructionText}>
                  • Touch and drag to move your ship{"\n"}
                  • Touch anywhere to shoot{"\n"}
                  • Avoid enemy ships and bullets{"\n"}
                  • Collect power-ups for advantages
                </Text>
              </View>
              
              <View style={styles.instructionSection}>
                <Text style={styles.instructionTitle}>💎 Power-ups</Text>
                <Text style={styles.instructionText}>
                  • 🟢 Health: Restore health{"\n"}
                  • 🟠 Weapon Upgrade: Better weapons{"\n"}
                  • 🔵 Shield: Temporary protection{"\n"}
                  • 🟡 Speed Boost: Move faster{"\n"}
                  • 🟣 Score Multiplier: Double points
                </Text>
              </View>
              
              <View style={styles.instructionSection}>
                <Text style={styles.instructionTitle}>👾 Enemies</Text>
                <Text style={styles.instructionText}>
                  • Red: Basic enemies{"\n"}
                  • Orange: Fast enemies{"\n"}
                  • Purple: Heavy enemies{"\n"}
                  • Pink: Boss enemies (every 5 waves)
                </Text>
              </View>
              
              <View style={styles.instructionSection}>
                <Text style={styles.instructionTitle}>🎯 Objective</Text>
                <Text style={styles.instructionText}>
                  Survive as long as possible and achieve the highest score!
                  Each wave gets progressively harder with more enemies.
                </Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSettingsModal = () => {
    return (
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsContainer}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>🔊 Audio</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Music Volume: 70%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>SFX Volume: 80%</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>📱 Controls</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Haptic Feedback: ON</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Touch Sensitivity: Medium</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>🎮 Gameplay</Text>
              <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>Auto-Fire: OFF</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animated starfield background */}
      <View style={styles.starfield}>
        {renderStarfield()}
      </View>
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#000033', '#000066', '#000000']}
        style={styles.gradient}
      />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SPACE</Text>
          <Text style={styles.titleAccent}>SHOOTER</Text>
          <Text style={styles.subtitle}>Multiplayer Edition</Text>
        </View>
        
        {/* Menu buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleSinglePlayerPress}
          >
            <LinearGradient
              colors={['#00ff00', '#008800']}
              style={styles.buttonGradient}
            >
              <Text style={styles.menuButtonText}>🚀 Single Player</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.menuButton,
              !isConnectedToServer && styles.disabledButton,
            ]}
            onPress={onStartMultiplayer}
            disabled={!isConnectedToServer}
          >
            <LinearGradient
              colors={isConnectedToServer ? ['#0088ff', '#004488'] : ['#666666', '#333333']}
              style={styles.buttonGradient}
            >
              <Text style={styles.menuButtonText}>
                🌐 Multiplayer {!isConnectedToServer && '(Offline)'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowInstructions(true)}
          >
            <LinearGradient
              colors={['#ffff00', '#888800']}
              style={styles.buttonGradient}
            >
              <Text style={styles.menuButtonText}>📖 How to Play</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowSettings(true)}
          >
            <LinearGradient
              colors={['#ff8800', '#884400']}
              style={styles.buttonGradient}
            >
              <Text style={styles.menuButtonText}>⚙️ Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onExit}
          >
            <LinearGradient
              colors={['#ff0000', '#880000']}
              style={styles.buttonGradient}
            >
              <Text style={styles.menuButtonText}>🚪 Exit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.connectionStatus}>
            Server: {isConnectedToServer ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
      </View>
      
      {/* Modals */}
      {renderDifficultyModal()}
      {renderInstructionsModal()}
      {renderSettingsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    paddingHorizontal: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: -10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 10,
  },
  menuContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuButton: {
    width: '80%',
    height: 60,
    marginBottom: 15,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  versionText: {
    color: '#666666',
    fontSize: 12,
  },
  connectionStatus: {
    color: '#888888',
    fontSize: 12,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '85%',
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
  difficultyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  difficultyDescription: {
    color: '#cccccc',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#666666',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  instructionSection: {
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
  },
  instructionText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
  settingsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  settingSection: {
    marginBottom: 20,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#666666',
  },
  settingButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#00ff00',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});