import io from 'socket.io-client';
import { GameState, Player, MultiplayerMessage, MessageType, Position } from '../types/GameTypes';

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
  gameStatus: string;
  hostId: string;
}

export interface MultiplayerConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export class MultiplayerManager {
  private socket: any = null;
  private config: MultiplayerConfig;
  private isConnected: boolean = false;
  private currentRoomId: string | null = null;
  private localPlayerId: string | null = null;
  private onGameStateUpdate: ((state: GameState) => void) | null = null;
  private onPlayerJoined: ((player: Player) => void) | null = null;
  private onPlayerLeft: ((playerId: string) => void) | null = null;
  private onRoomUpdate: ((roomInfo: RoomInfo) => void) | null = null;
  private onConnectionStatusChange: ((connected: boolean) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: MultiplayerConfig) {
    this.config = config;
    this.localPlayerId = this.generatePlayerId();
  }

  public async connect(): Promise<boolean> {
    try {
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay
      });

      this.setupEventListeners();
      
      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectionStatusChange?.(true);
          resolve(true);
        });

        this.socket!.on('connect_error', (error: any) => {
          console.error('Connection error:', error);
          this.isConnected = false;
          this.onConnectionStatusChange?.(false);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentRoomId = null;
    this.onConnectionStatusChange?.(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason: any) => {
      console.log('Disconnected:', reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.onConnectionStatusChange?.(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.onConnectionStatusChange?.(true);
      
      // Rejoin room if we were in one
      if (this.currentRoomId) {
        this.joinRoom(this.currentRoomId);
      }
    });

    // Game events
    this.socket.on('playerJoined', (player: Player) => {
      this.onPlayerJoined?.(player);
    });

    this.socket.on('playerLeft', (playerId: string) => {
      this.onPlayerLeft?.(playerId);
    });

    this.socket.on('gameStateUpdate', (gameState: GameState) => {
      this.onGameStateUpdate?.(gameState);
    });

    this.socket.on('roomUpdate', (roomInfo: RoomInfo) => {
      this.onRoomUpdate?.(roomInfo);
    });

    // Player action events
    this.socket.on('playerMove', (data: { playerId: string; position: Position }) => {
      this.handlePlayerMove(data.playerId, data.position);
    });

    this.socket.on('playerShoot', (data: { playerId: string }) => {
      this.handlePlayerShoot(data.playerId);
    });

    // Room events
    this.socket.on('roomCreated', (roomInfo: RoomInfo) => {
      this.currentRoomId = roomInfo.roomId;
      this.onRoomUpdate?.(roomInfo);
    });

    this.socket.on('roomJoined', (roomInfo: RoomInfo) => {
      this.currentRoomId = roomInfo.roomId;
      this.onRoomUpdate?.(roomInfo);
    });

    this.socket.on('roomError', (error: string) => {
      console.error('Room error:', error);
    });

    // Heartbeat
    this.socket.on('pong', () => {
      // Server responded to ping
    });
  }

  public async createRoom(playerName: string, maxPlayers: number = 4): Promise<string | null> {
    if (!this.isConnected || !this.socket) {
      console.error('Not connected to server');
      return null;
    }

    return new Promise((resolve) => {
      this.socket!.emit('createRoom', {
        playerId: this.localPlayerId,
        playerName,
        maxPlayers
      });

      this.socket!.once('roomCreated', (roomInfo: RoomInfo) => {
        resolve(roomInfo.roomId);
      });

      this.socket!.once('roomError', () => {
        resolve(null);
      });
    });
  }

  public async joinRoom(roomId: string, playerName?: string): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      console.error('Not connected to server');
      return false;
    }

    return new Promise((resolve) => {
      this.socket!.emit('joinRoom', {
        roomId,
        playerId: this.localPlayerId,
        playerName: playerName || `Player_${this.localPlayerId?.slice(-4)}`
      });

      this.socket!.once('roomJoined', () => {
        resolve(true);
      });

      this.socket!.once('roomError', () => {
        resolve(false);
      });
    });
  }

  public leaveRoom(): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('leaveRoom', {
        roomId: this.currentRoomId,
        playerId: this.localPlayerId
      });
      this.currentRoomId = null;
    }
  }

  public sendPlayerMove(position: Position): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('playerMove', {
        roomId: this.currentRoomId,
        playerId: this.localPlayerId,
        position,
        timestamp: Date.now()
      });
    }
  }

  public sendPlayerShoot(): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('playerShoot', {
        roomId: this.currentRoomId,
        playerId: this.localPlayerId,
        timestamp: Date.now()
      });
    }
  }

  public sendGameStateUpdate(gameState: GameState): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('gameStateUpdate', {
        roomId: this.currentRoomId,
        gameState,
        timestamp: Date.now()
      });
    }
  }

  public startGame(): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('startGame', {
        roomId: this.currentRoomId,
        playerId: this.localPlayerId
      });
    }
  }

  private handlePlayerMove(playerId: string, position: Position): void {
    // This would be handled by the game engine
    // The multiplayer manager just facilitates communication
  }

  private handlePlayerShoot(playerId: string): void {
    // This would be handled by the game engine
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.config.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event listener setters
  public setOnGameStateUpdate(callback: (state: GameState) => void): void {
    this.onGameStateUpdate = callback;
  }

  public setOnPlayerJoined(callback: (player: Player) => void): void {
    this.onPlayerJoined = callback;
  }

  public setOnPlayerLeft(callback: (playerId: string) => void): void {
    this.onPlayerLeft = callback;
  }

  public setOnRoomUpdate(callback: (roomInfo: RoomInfo) => void): void {
    this.onRoomUpdate = callback;
  }

  public setOnConnectionStatusChange(callback: (connected: boolean) => void): void {
    this.onConnectionStatusChange = callback;
  }

  // Missing methods that are called in components
  public onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  public onDisconnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  public onRoomList(callback: (rooms: RoomInfo[]) => void): void {
    if (this.socket) {
      this.socket.on('roomList', callback);
    }
  }

  public onRoomJoined(callback: (roomInfo: RoomInfo) => void): void {
    if (this.socket) {
      this.socket.on('roomJoined', callback);
    }
  }

  public onRoomLeft(callback: () => void): void {
    if (this.socket) {
      this.socket.on('roomLeft', callback);
    }
  }

  public onPlayerReady(callback: (data: { playerId: string; ready: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('playerReady', callback);
    }
  }

  public onGameStart(callback: () => void): void {
    if (this.socket) {
      this.socket.on('gameStart', callback);
    }
  }

  public onError(callback: (error: string) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
      this.socket.on('roomError', callback);
    }
  }

  public requestRoomList(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('requestRoomList');
    }
  }

  public setReady(ready: boolean): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('setReady', {
        roomId: this.currentRoomId,
        playerId: this.localPlayerId,
        ready
      });
    }
  }

  // Getters
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  public getLocalPlayerId(): string | null {
    return this.localPlayerId;
  }

  public getConnectionStatus(): {
    connected: boolean;
    roomId: string | null;
    playerId: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      roomId: this.currentRoomId,
      playerId: this.localPlayerId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}