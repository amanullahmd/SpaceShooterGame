import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Alert,
  BackHandler,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from './src/components/Game';
import { GameMenu } from './src/components/GameMenu';
import { MultiplayerLobby } from './src/components/MultiplayerLobby';
import { MultiplayerManager } from './src/multiplayer/MultiplayerManager';
import { DifficultyLevel } from './src/types/GameTypes';

type AppState = 'menu' | 'singlePlayer' | 'multiplayerLobby' | 'multiplayerGame';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [multiplayerManager] = useState(() => new MultiplayerManager({
    serverUrl: 'ws://localhost:3001',
    reconnectAttempts: 5,
    reconnectDelay: 1000
  }));
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
    setupBackHandler();
    
    return () => {
      multiplayerManager.disconnect();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Load player name from storage
      const storedName = await AsyncStorage.getItem('playerName');
      if (storedName) {
        setPlayerName(storedName);
      } else {
        // Generate a random player name
        const randomName = `Player${Math.floor(Math.random() * 9999) + 1}`;
        setPlayerName(randomName);
        await AsyncStorage.setItem('playerName', randomName);
      }

      // Try to connect to multiplayer server
      try {
        const connected = await multiplayerManager.connect();
        setIsConnectedToServer(connected);
        if (!connected) {
          Alert.alert('Connection Error', 'Failed to connect to multiplayer server');
        }
      } catch (error) {
        console.error('Failed to connect to multiplayer server:', error);
        Alert.alert('Connection Error', 'Failed to connect to multiplayer server');
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const setupBackHandler = () => {
    const backAction = () => {
      if (appState === 'menu') {
        Alert.alert(
          'Exit Game',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      } else {
        handleBackToMenu();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const handleStartSinglePlayer = (selectedDifficulty: DifficultyLevel) => {
    setDifficulty(selectedDifficulty);
    setAppState('singlePlayer');
  };

  const handleStartMultiplayer = () => {
    if (isConnectedToServer) {
      setAppState('multiplayerLobby');
    } else {
      Alert.alert(
        'Connection Error',
        'Unable to connect to multiplayer server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMultiplayerGameStart = (roomId: string) => {
    setCurrentRoomId(roomId);
    setAppState('multiplayerGame');
  };

  const handleBackToMenu = () => {
    if (appState === 'multiplayerGame' || appState === 'multiplayerLobby') {
      multiplayerManager.leaveRoom();
      setCurrentRoomId(null);
    }
    setAppState('menu');
  };

  const handleGameRestart = () => {
    // For single player, just restart the current game
    if (appState === 'singlePlayer') {
      setAppState('menu');
      setTimeout(() => {
        setAppState('singlePlayer');
      }, 100);
    }
  };

  const handleShareScore = async (score: number) => {
    try {
      const message = `🚀 I just scored ${score.toLocaleString()} points in Space Shooter! Can you beat my score? 🎮`;
      
      await Share.share({
        message,
        title: 'Space Shooter High Score',
      });
    } catch (error) {
      console.error('Error sharing score:', error);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]
    );
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'menu':
        return (
          <GameMenu
            onStartSinglePlayer={handleStartSinglePlayer}
            onStartMultiplayer={handleStartMultiplayer}
            onExit={handleExit}
            isConnectedToServer={isConnectedToServer}
          />
        );

      case 'singlePlayer':
        return (
          <Game
            difficulty={difficulty}
            isMultiplayer={false}
            multiplayerManager={null}
            roomId={null}
            onGameEnd={handleBackToMenu}
            onBackToMenu={handleBackToMenu}
            onRestart={handleGameRestart}
            onShareScore={handleShareScore}
            playerName={playerName}
            onExit={handleBackToMenu}
          />
        );

      case 'multiplayerLobby':
        return (
          <MultiplayerLobby
            visible={true}
            multiplayerManager={multiplayerManager}
            onStartGame={handleMultiplayerGameStart}
            onBack={handleBackToMenu}
            playerName={playerName}
          />
        );

      case 'multiplayerGame':
        return (
          <Game
            difficulty={DifficultyLevel.MEDIUM} // Multiplayer uses fixed difficulty
            isMultiplayer={true}
            multiplayerManager={multiplayerManager}
            roomId={currentRoomId}
            onGameEnd={handleBackToMenu}
            onBackToMenu={handleBackToMenu}
            onRestart={handleGameRestart}
            onShareScore={handleShareScore}
            playerName={playerName}
            onExit={handleBackToMenu}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent />
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
