import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MultiplayerManager, RoomInfo } from '../multiplayer/MultiplayerManager';
import { Player } from '../types/GameTypes';

interface MultiplayerLobbyProps {
  visible: boolean;
  multiplayerManager: MultiplayerManager;
  onStartGame: (roomId: string) => void;
  onBack: () => void;
  playerName: string;
}

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameInProgress: boolean;
  gameStatus: string;
  hostId: string;
}

interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  visible,
  multiplayerManager,
  onStartGame,
  onBack,
  playerName,
}) => {
  const [currentView, setCurrentView] = useState<'rooms' | 'lobby'>('rooms');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playersInRoom, setPlayersInRoom] = useState<LobbyPlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      setupMultiplayerListeners();
      connectToServer();
    }
    
    return () => {
      if (multiplayerManager) {
        multiplayerManager.disconnect();
      }
    };
  }, [visible]);

  const setupMultiplayerListeners = () => {
    multiplayerManager.onConnect(() => {
      setIsConnected(true);
      setConnectionStatus('Connected');
      requestRoomList();
    });

    multiplayerManager.onDisconnect(() => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      setCurrentView('rooms');
      setCurrentRoom(null);
    });

    multiplayerManager.onRoomList((rooms: RoomInfo[]) => {
      const mappedRooms: Room[] = rooms.map(room => ({
        id: room.roomId,
        name: room.roomId,
        playerCount: room.playerCount,
        maxPlayers: room.maxPlayers,
        isPrivate: false,
        gameInProgress: room.gameStatus === 'playing',
        gameStatus: room.gameStatus,
        hostId: room.hostId
      }));
      setAvailableRooms(mappedRooms);
    });

    multiplayerManager.onRoomJoined((room: any) => {
      setCurrentRoom(room);
      setPlayersInRoom(room.players || []);
      setCurrentView('lobby');
      setIsReady(false);
    });

    multiplayerManager.onRoomLeft(() => {
      setCurrentRoom(null);
      setPlayersInRoom([]);
      setCurrentView('rooms');
      setIsReady(false);
      requestRoomList();
    });

    multiplayerManager.setOnPlayerJoined((player: Player) => {
      const lobbyPlayer: LobbyPlayer = {
        id: player.playerId,
        name: player.playerName,
        isReady: false,
        isHost: false
      };
      setPlayersInRoom(prev => [...prev, lobbyPlayer]);
    });

    multiplayerManager.setOnPlayerLeft((playerId: string) => {
      setPlayersInRoom(prev => prev.filter(p => p.id !== playerId));
    });

    multiplayerManager.onPlayerReady((data: { playerId: string; ready: boolean }) => {
      setPlayersInRoom(prev =>
        prev.map(p => p.id === data.playerId ? { ...p, isReady: data.ready } : p)
      );
    });

    multiplayerManager.onGameStart(() => {
      if (currentRoom) {
        onStartGame(currentRoom.id);
      }
    });

    multiplayerManager.onError((error: string) => {
      Alert.alert('Multiplayer Error', error);
    });
  };

  const connectToServer = async () => {
    try {
      setConnectionStatus('Connecting...');
      await multiplayerManager.connect();
    } catch (error) {
      setConnectionStatus('Connection Failed');
      Alert.alert('Connection Error', 'Failed to connect to multiplayer server');
    }
  };

  const requestRoomList = () => {
    if (isConnected) {
      multiplayerManager.requestRoomList();
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      const roomId = await multiplayerManager.createRoom(newRoomName, newRoomMaxPlayers);
      if (roomId) {
        setShowCreateRoom(false);
        setNewRoomName('');
        setNewRoomPrivate(false);
        setNewRoomMaxPlayers(4);
      } else {
        Alert.alert('Error', 'Failed to create room');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create room');
    }
  };

  const handleJoinRoom = (roomId: string) => {
    multiplayerManager.joinRoom(roomId);
  };

  const handleJoinPrivateRoom = () => {
    if (!joinRoomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    multiplayerManager.joinRoom(joinRoomCode);
    setShowJoinPrivate(false);
    setJoinRoomCode('');
  };

  const handleLeaveRoom = () => {
    multiplayerManager.leaveRoom();
  };

  const handleToggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    multiplayerManager.setReady(newReadyState);
  };

  const handleStartGame = () => {
    if (currentRoom && isHost()) {
      const allReady = playersInRoom.every(p => p.isReady || p.isHost);
      if (allReady && playersInRoom.length >= 2) {
        multiplayerManager.startGame();
      } else {
        Alert.alert('Cannot Start', 'All players must be ready and at least 2 players required');
      }
    }
  };

  const isHost = (): boolean => {
    return playersInRoom.some(p => p.name === playerName && p.isHost);
  };

  const renderStarfield = () => {
    const stars = [];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * screenWidth;
      const y = Math.random() * screenHeight;
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.6 + 0.2;
      
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

  const renderCreateRoomModal = () => {
    return (
      <Modal
        visible={showCreateRoom}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateRoom(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createRoomModal}>
            <Text style={styles.modalTitle}>Create New Room</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Room Name</Text>
              <TextInput
                style={styles.textInput}
                value={newRoomName}
                onChangeText={setNewRoomName}
                placeholder="Enter room name"
                placeholderTextColor="#666666"
                maxLength={20}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Max Players</Text>
              <View style={styles.playerCountContainer}>
                {[2, 3, 4, 6, 8].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.playerCountButton,
                      newRoomMaxPlayers === count && styles.selectedPlayerCount
                    ]}
                    onPress={() => setNewRoomMaxPlayers(count)}
                  >
                    <Text style={[
                      styles.playerCountText,
                      newRoomMaxPlayers === count && styles.selectedPlayerCountText
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setNewRoomPrivate(!newRoomPrivate)}
            >
              <View style={[
                styles.checkbox,
                newRoomPrivate && styles.checkedCheckbox
              ]}>
                {newRoomPrivate && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Private Room</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCreateRoom}
              >
                <LinearGradient
                  colors={['#00ff00', '#008800']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Create Room</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateRoom(false)}
              >
                <LinearGradient
                  colors={['#666666', '#333333']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderJoinPrivateModal = () => {
    return (
      <Modal
        visible={showJoinPrivate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinPrivate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.joinPrivateModal}>
            <Text style={styles.modalTitle}>Join Private Room</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Room Code</Text>
              <TextInput
                style={styles.textInput}
                value={joinRoomCode}
                onChangeText={setJoinRoomCode}
                placeholder="Enter room code"
                placeholderTextColor="#666666"
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleJoinPrivateRoom}
              >
                <LinearGradient
                  colors={['#0088ff', '#004488']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Join Room</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowJoinPrivate(false)}
              >
                <LinearGradient
                  colors={['#666666', '#333333']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRoomsList = () => {
    return (
      <View style={styles.roomsContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Multiplayer Rooms</Text>
          <Text style={styles.connectionStatus}>
            Status: {connectionStatus}
          </Text>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateRoom(true)}
            disabled={!isConnected}
          >
            <LinearGradient
              colors={isConnected ? ['#00ff00', '#008800'] : ['#666666', '#333333']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>🏗️ Create Room</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowJoinPrivate(true)}
            disabled={!isConnected}
          >
            <LinearGradient
              colors={isConnected ? ['#0088ff', '#004488'] : ['#666666', '#333333']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>🔐 Join Private</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={requestRoomList}
            disabled={!isConnected}
          >
            <LinearGradient
              colors={isConnected ? ['#ffaa00', '#885500'] : ['#666666', '#333333']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>🔄 Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.roomsList} showsVerticalScrollIndicator={false}>
          {availableRooms.length === 0 ? (
            <View style={styles.noRoomsContainer}>
              <Text style={styles.noRoomsText}>
                {isConnected ? 'No rooms available' : 'Connecting to server...'}
              </Text>
            </View>
          ) : (
            availableRooms.map(room => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomItem,
                  room.gameInProgress && styles.roomInProgress
                ]}
                onPress={() => handleJoinRoom(room.id)}
                disabled={room.gameInProgress || room.playerCount >= room.maxPlayers}
              >
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomDetails}>
                    {room.playerCount}/{room.maxPlayers} players
                    {room.isPrivate && ' • Private'}
                    {room.gameInProgress && ' • In Game'}
                  </Text>
                </View>
                
                <View style={[
                  styles.roomStatus,
                  room.gameInProgress && styles.roomStatusInProgress,
                  room.playerCount >= room.maxPlayers && styles.roomStatusFull
                ]}>
                  <Text style={styles.roomStatusText}>
                    {room.gameInProgress ? '🎮' : room.playerCount >= room.maxPlayers ? '🔒' : '👥'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <LinearGradient
            colors={['#ff6600', '#883300']}
            style={styles.backButtonGradient}
          >
            <Text style={styles.backButtonText}>← Back to Menu</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLobby = () => {
    if (!currentRoom) return null;

    return (
      <View style={styles.lobbyContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentRoom.name}</Text>
          <Text style={styles.roomCode}>
            {currentRoom.isPrivate ? `Code: ${currentRoom.id}` : 'Public Room'}
          </Text>
        </View>
        
        <View style={styles.playersContainer}>
          <Text style={styles.playersTitle}>
            Players ({playersInRoom.length}/{currentRoom.maxPlayers})
          </Text>
          
          <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
            {playersInRoom.map(player => (
              <View key={player.id} style={styles.playerItem}>
                <View style={styles.playerInfo}>
                  <Text style={[
                    styles.playerName,
                    player.name === playerName && styles.currentPlayerName
                  ]}>
                    {player.name}
                    {player.isHost && ' 👑'}
                    {player.name === playerName && ' (You)'}
                  </Text>
                </View>
                
                <View style={[
                  styles.playerStatus,
                  player.isReady && styles.playerReady
                ]}>
                  <Text style={styles.playerStatusText}>
                    {player.isHost ? '👑' : player.isReady ? '✅' : '⏳'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.lobbyButtonsContainer}>
          <TouchableOpacity
            style={styles.readyButton}
            onPress={handleToggleReady}
            disabled={isHost()}
          >
            <LinearGradient
              colors={isReady ? ['#ff8800', '#884400'] : ['#00ff00', '#008800']}
              style={styles.readyButtonGradient}
            >
              <Text style={styles.readyButtonText}>
                {isHost() ? '👑 Host' : isReady ? '❌ Not Ready' : '✅ Ready'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {isHost() && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <LinearGradient
                colors={['#0088ff', '#004488']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>🚀 Start Game</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRoom}
          >
            <LinearGradient
              colors={['#ff4444', '#882222']}
              style={styles.leaveButtonGradient}
            >
              <Text style={styles.leaveButtonText}>🚪 Leave Room</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
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
        
        {currentView === 'rooms' ? renderRoomsList() : renderLobby()}
        
        {/* Modals */}
        {renderCreateRoomModal()}
        {renderJoinPrivateModal()}
      </View>
    </Modal>
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
    borderRadius: 1,
  },
  gradient: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  roomsContainer: {
    flex: 1,
    padding: 20,
  },
  lobbyContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  connectionStatus: {
    fontSize: 14,
    color: '#888888',
    marginTop: 5,
  },
  roomCode: {
    fontSize: 16,
    color: '#00ffff',
    marginTop: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    height: 45,
    marginHorizontal: 5,
    borderRadius: 22.5,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomsList: {
    flex: 1,
  },
  noRoomsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noRoomsText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomInProgress: {
    opacity: 0.6,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomDetails: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 2,
  },
  roomStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomStatusInProgress: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  roomStatusFull: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  roomStatusText: {
    fontSize: 18,
  },
  playersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  playersTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentPlayerName: {
    color: '#00ffff',
  },
  playerStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerReady: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  playerStatusText: {
    fontSize: 14,
  },
  lobbyButtonsContainer: {
    alignItems: 'center',
  },
  readyButton: {
    width: '80%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 10,
  },
  readyButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    width: '80%',
    height: 55,
    borderRadius: 27.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  startButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaveButton: {
    width: '60%',
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
  },
  leaveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  backButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
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
  createRoomModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  joinPrivateModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    borderWidth: 2,
    borderColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playerCountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedPlayerCount: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderColor: '#00ffff',
  },
  playerCountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedPlayerCountText: {
    color: '#00ffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#cccccc',
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    height: 45,
    marginHorizontal: 5,
    borderRadius: 22.5,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});