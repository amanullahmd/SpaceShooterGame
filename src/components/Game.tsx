import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Dimensions, PanResponder, Alert } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { GameEngine as CustomGameEngine } from '../engine/GameEngine';
import { MultiplayerManager } from '../multiplayer/MultiplayerManager';
import { GameState, GameConfig, Player, GameStatus, DifficultyLevel } from '../types/GameTypes';
import { GameRenderer } from './GameRenderer';
import { GameHUD } from './GameHUD';
import { GameMenu } from './GameMenu';
import { PauseMenu } from './PauseMenu';
import { GameOverScreen } from './GameOverScreen';
import * as Haptics from 'expo-haptics';

interface GameProps {
  difficulty?: DifficultyLevel;
  isMultiplayer?: boolean;
  multiplayerManager?: MultiplayerManager | null;
  roomId?: string | null;
  onGameEnd?: () => void;
  onBackToMenu?: () => void;
  onRestart?: () => void;
  onShareScore?: (score: number) => void;
  playerName?: string;
  onExit?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GAME_CONFIG: GameConfig = {
  screenWidth,
  screenHeight,
  playerSpeed: 200,
  bulletSpeed: 300,
  enemySpeed: 100,
  spawnRate: 2000,
  difficulty: DifficultyLevel.MEDIUM
};

const MULTIPLAYER_CONFIG = {
  serverUrl: 'ws://localhost:3001', // Replace with your server URL
  reconnectAttempts: 5,
  reconnectDelay: 2000
};

export const Game: React.FC<GameProps> = ({ 
  difficulty = DifficultyLevel.MEDIUM,
  isMultiplayer = false,
  multiplayerManager = null,
  roomId = null,
  onGameEnd,
  onBackToMenu,
  onRestart,
  onShareScore,
  playerName,
  onExit
}) => {
  const gameEngineRef = useRef<CustomGameEngine | null>(null);
  const multiplayerManagerRef = useRef<MultiplayerManager | null>(null);
  const gameEngineComponentRef = useRef<GameEngine | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    enemies: [],
    bullets: [],
    powerUps: [],
    explosions: [],
    score: 0,
    level: 1,
    wave: 1,
    enemiesKilled: 0,
    powerUpsCollected: 0,
    accuracy: 0,
    gameStatus: GameStatus.MENU,
    isPaused: false,
    timeElapsed: 0,
    isMultiplayer: false
  });
  
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: screenWidth / 2, y: screenHeight - 100 });
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);

  // Initialize game engine
  useEffect(() => {
    gameEngineRef.current = new CustomGameEngine(GAME_CONFIG, handleGameStateUpdate);
    
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.dispose();
      }
    };
  }, []);



  // Initialize multiplayer manager
  useEffect(() => {
    multiplayerManagerRef.current = new MultiplayerManager(MULTIPLAYER_CONFIG);
    
    const multiplayerManager = multiplayerManagerRef.current;
    
    multiplayerManager.setOnConnectionStatusChange(setIsConnectedToServer);
    multiplayerManager.setOnGameStateUpdate(handleMultiplayerGameStateUpdate);
    multiplayerManager.setOnPlayerJoined(handlePlayerJoined);
    multiplayerManager.setOnPlayerLeft(handlePlayerLeft);
    
    return () => {
      if (multiplayerManagerRef.current) {
        multiplayerManagerRef.current.disconnect();
      }
    };
  }, []);

  const handleGameStateUpdate = useCallback((newGameState: GameState) => {
    setGameState(newGameState);
    
    // Send updates to multiplayer if in multiplayer mode
    if (isMultiplayerMode && multiplayerManagerRef.current) {
      multiplayerManagerRef.current.sendGameStateUpdate(newGameState);
    }
  }, [isMultiplayerMode]);

  const handleMultiplayerGameStateUpdate = useCallback((newGameState: GameState) => {
    if (isMultiplayerMode) {
      setGameState(newGameState);
    }
  }, [isMultiplayerMode]);

  const handlePlayerJoined = useCallback((player: Player) => {
    console.log('Player joined:', player.playerName);
    // Handle player joining logic
  }, []);

  const handlePlayerLeft = useCallback((playerId: string) => {
    console.log('Player left:', playerId);
    // Handle player leaving logic
  }, []);

  // Touch controls
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      // Player started touching - shoot
      handlePlayerShoot();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // Update player position based on touch
      const newX = Math.max(30, Math.min(screenWidth - 30, evt.nativeEvent.pageX));
      const newY = Math.max(50, Math.min(screenHeight - 150, evt.nativeEvent.pageY));
      
      const newPosition = { x: newX, y: newY };
      setPlayerPosition(newPosition);
      
      // Update player position in game engine
      if (gameEngineRef.current) {
        const localPlayer = gameState.players.find(p => p.isLocalPlayer);
        if (localPlayer) {
          gameEngineRef.current.updatePlayerPosition(localPlayer.playerId, newPosition);
        }
      }
      
      // Send position update in multiplayer
      if (isMultiplayerMode && multiplayerManagerRef.current) {
        multiplayerManagerRef.current.sendPlayerMove(newPosition);
      }
    },
    
    onPanResponderRelease: () => {
      // Player stopped touching
    }
  });

  const handlePlayerShoot = useCallback(() => {
    if (gameState.gameStatus === GameStatus.PLAYING && gameEngineRef.current) {
      const localPlayer = gameState.players.find(p => p.isLocalPlayer);
      if (localPlayer) {
        gameEngineRef.current.playerShoot(localPlayer.playerId);
        
        // Send shoot event in multiplayer
        if (isMultiplayerMode && multiplayerManagerRef.current) {
          multiplayerManagerRef.current.sendPlayerShoot();
        }
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [gameState.gameStatus, gameState.players, isMultiplayerMode]);

  const startSinglePlayerGame = useCallback((difficulty: DifficultyLevel) => {
    if (gameEngineRef.current) {
      // Create local player
      const localPlayer: Player = {
        id: 'local_player',
        playerId: 'local_player',
        playerName: 'Player',
        position: playerPosition,
        velocity: { x: 0, y: 0 },
        size: { width: 40, height: 40 },
        rotation: 0,
        health: 100,
        maxHealth: 100,
        isActive: true,
        score: 0,
        lives: 3,
        weaponType: 'basic' as any,
        powerUps: [],
        isLocalPlayer: true
      };
      
      gameEngineRef.current.addPlayer(localPlayer);
      setIsMultiplayerMode(false);
      gameEngineRef.current.startGame(false);
    }
  }, [playerPosition]);

  const startMultiplayerGame = useCallback(async () => {
    if (!multiplayerManagerRef.current) return;
    
    try {
      const connected = await multiplayerManagerRef.current.connect();
      if (!connected) {
        Alert.alert('Connection Error', 'Failed to connect to multiplayer server');
        return;
      }
      
      const roomId = await multiplayerManagerRef.current.createRoom('Player', 4);
      if (!roomId) {
        Alert.alert('Room Error', 'Failed to create multiplayer room');
        return;
      }
      
      setIsMultiplayerMode(true);
      
      // Create local player for multiplayer
      const localPlayer: Player = {
        id: multiplayerManagerRef.current.getLocalPlayerId() || 'local_player',
        playerId: multiplayerManagerRef.current.getLocalPlayerId() || 'local_player',
        playerName: 'Player',
        position: playerPosition,
        velocity: { x: 0, y: 0 },
        size: { width: 40, height: 40 },
        rotation: 0,
        health: 100,
        maxHealth: 100,
        isActive: true,
        score: 0,
        lives: 3,
        weaponType: 'basic' as any,
        powerUps: [],
        isLocalPlayer: true
      };
      
      if (gameEngineRef.current) {
        gameEngineRef.current.addPlayer(localPlayer);
        gameEngineRef.current.startGame(true);
      }
    } catch (error) {
      console.error('Failed to start multiplayer game:', error);
      Alert.alert('Error', 'Failed to start multiplayer game');
    }
  }, [playerPosition]);

  const pauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
    }
  }, []);

  const restartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stopGame();
      // Reset game state
      setGameState({
        players: [],
        enemies: [],
        bullets: [],
        powerUps: [],
        explosions: [],
        score: 0,
        level: 1,
        wave: 1,
        enemiesKilled: 0,
        powerUpsCollected: 0,
        accuracy: 0,
        gameStatus: GameStatus.MENU,
        isPaused: false,
        timeElapsed: 0,
        isMultiplayer: false
      });
    }
  }, []);

  const exitToMenu = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stopGame();
    }
    if (multiplayerManagerRef.current) {
      multiplayerManagerRef.current.disconnect();
    }
    onBackToMenu?.();
  }, [onBackToMenu]);

  const quitGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stopGame();
    }
    if (multiplayerManagerRef.current) {
      multiplayerManagerRef.current.disconnect();
    }
    onExit?.();
  }, [onExit]);

  // Handle keyboard shortcuts for quitting
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (gameState.gameStatus === GameStatus.PLAYING && !gameState.isPaused) {
          // Pause the game first
          pauseGame();
        } else if (gameState.isPaused) {
          // If already paused, show quit confirmation
          Alert.alert(
            'Quit Game',
            'Are you sure you want to quit the current game?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Quit', style: 'destructive', onPress: quitGame },
            ]
          );
        }
      }
    };

    // Add event listener for web
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [gameState.gameStatus, gameState.isPaused, pauseGame, quitGame]);

  // Render different screens based on game status
  const renderGameScreen = () => {
    switch (gameState.gameStatus) {
      case GameStatus.MENU:
        return (
          <GameMenu
            onStartSinglePlayer={startSinglePlayerGame}
            onStartMultiplayer={startMultiplayerGame}
            onExit={exitToMenu}
            isConnectedToServer={isConnectedToServer}
          />
        );
        
      case GameStatus.PLAYING:
        return (
          <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            <GameRenderer gameState={gameState} />
            <GameHUD 
              gameState={gameState}
              onPause={pauseGame}
              roomId={roomId}
            />
          </View>
        );
        
      case GameStatus.PAUSED:
        return (
          <View style={{ flex: 1 }}>
            <GameRenderer gameState={gameState} />
            <PauseMenu
              visible={true}
              onResume={resumeGame}
              onRestart={restartGame}
              onMainMenu={exitToMenu}
              onSettings={() => {}}
              onQuit={quitGame}
              isMultiplayer={gameState.isMultiplayer}
              gameStats={{
                score: gameState.score,
                wave: gameState.wave,
                timeElapsed: gameState.timeElapsed,
                enemiesKilled: gameState.enemiesKilled
              }}
            />
          </View>
        );
        
      case GameStatus.GAME_OVER:
      case GameStatus.VICTORY:
        return (
          <GameOverScreen
            visible={true}
            gameStats={{
              score: gameState.score,
              wave: gameState.wave,
              timeElapsed: gameState.timeElapsed,
              enemiesKilled: gameState.enemiesKilled,
              powerUpsCollected: gameState.powerUpsCollected,
              accuracy: gameState.accuracy,
              isNewHighScore: false
            }}
            isMultiplayer={isMultiplayer}
            onRestart={restartGame}
            onMainMenu={exitToMenu}
            onShare={() => {}}
          />
        );
        
      default:
        return (
          <GameMenu
            onStartSinglePlayer={startSinglePlayerGame}
            onStartMultiplayer={startMultiplayerGame}
            onExit={exitToMenu}
            isConnectedToServer={isConnectedToServer}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {renderGameScreen()}
    </View>
  );
};