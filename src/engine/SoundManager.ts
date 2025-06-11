import { Audio } from 'expo-av';
import { WeaponType } from '../types/GameTypes';

interface SoundAssets {
  [key: string]: Audio.Sound | null;
}

export class SoundManager {
  private sounds: SoundAssets = {};
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private isMuted: boolean = false;
  private backgroundMusic: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeSounds();
  }

  private async initializeSounds(): Promise<void> {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      // Load sound effects
      await this.loadSoundEffects();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize sound manager:', error);
    }
  }

  private async loadSoundEffects(): Promise<void> {
    // Initialize all sound keys to null since we don't have sound files yet
    const soundKeys = [
      // Weapon sounds
      'shootBasic', 'shootRapid', 'shootLaser', 'shootMissile',
      // Effect sounds
      'explosion', 'powerUp', 'enemyHit', 'playerHit',
      // UI sounds
      'buttonClick', 'gameOver', 'victory',
      // Background music
      'backgroundMusic', 'menuMusic'
    ];

    // Initialize all sounds to null for now
    // This allows the game to run without sound files
    for (const key of soundKeys) {
      this.sounds[key] = null;
    }

    console.log('Sound system initialized (no sound files loaded)');
  }

  public async playShootSound(weaponType: WeaponType): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;

    let soundKey = 'shootBasic';
    switch (weaponType) {
      case WeaponType.BASIC:
        soundKey = 'shootBasic';
        break;
      case WeaponType.RAPID_FIRE:
        soundKey = 'shootRapid';
        break;
      case WeaponType.LASER:
        soundKey = 'shootLaser';
        break;
      case WeaponType.MISSILE:
        soundKey = 'shootMissile';
        break;
      default:
        soundKey = 'shootBasic';
    }

    await this.playSound(soundKey);
  }

  public async playExplosionSound(): Promise<void> {
    await this.playSound('explosion');
  }

  public async playPowerUpSound(): Promise<void> {
    await this.playSound('powerUp');
  }

  public async playEnemyHitSound(): Promise<void> {
    await this.playSound('enemyHit');
  }

  public async playPlayerHitSound(): Promise<void> {
    await this.playSound('playerHit');
  }

  public async playButtonClickSound(): Promise<void> {
    await this.playSound('buttonClick');
  }

  public async playGameOverSound(): Promise<void> {
    await this.playSound('gameOver');
  }

  public async playVictorySound(): Promise<void> {
    await this.playSound('victory');
  }

  private async playSound(soundKey: string): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;

    const sound = this.sounds[soundKey];
    if (sound) {
      try {
        // Stop the sound if it's already playing
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.warn(`Failed to play sound: ${soundKey}`, error);
      }
    }
  }

  public async startBackgroundMusic(): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;

    const music = this.sounds['backgroundMusic'];
    if (music && !this.backgroundMusic) {
      try {
        this.backgroundMusic = music;
        await music.setIsLoopingAsync(true);
        await music.setVolumeAsync(this.musicVolume);
        await music.playAsync();
      } catch (error) {
        console.warn('Failed to start background music:', error);
      }
    }
  }

  public async stopBackgroundMusic(): Promise<void> {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.stopAsync();
        this.backgroundMusic = null;
      } catch (error) {
        console.warn('Failed to stop background music:', error);
      }
    }
  }

  public async startMenuMusic(): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;

    // Stop background music if playing
    await this.stopBackgroundMusic();

    const music = this.sounds['menuMusic'];
    if (music) {
      try {
        await music.setIsLoopingAsync(true);
        await music.setVolumeAsync(this.musicVolume);
        await music.playAsync();
        this.backgroundMusic = music;
      } catch (error) {
        console.warn('Failed to start menu music:', error);
      }
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolumeAsync(this.musicVolume);
    }
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all SFX sounds
    Object.entries(this.sounds).forEach(([key, sound]) => {
      if (sound && !key.includes('Music')) {
        sound.setVolumeAsync(this.sfxVolume);
      }
    });
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public async pauseAllSounds(): Promise<void> {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.pauseAsync();
      } catch (error) {
        console.warn('Failed to pause background music:', error);
      }
    }
  }

  public async resumeAllSounds(): Promise<void> {
    if (this.backgroundMusic && !this.isMuted) {
      try {
        await this.backgroundMusic.playAsync();
      } catch (error) {
        console.warn('Failed to resume background music:', error);
      }
    }
  }

  public dispose(): void {
    // Unload all sounds
    Object.values(this.sounds).forEach(async (sound) => {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Failed to unload sound:', error);
        }
      }
    });
    
    this.sounds = {};
    this.backgroundMusic = null;
    this.isInitialized = false;
  }

  // Preload critical sounds for better performance
  public async preloadCriticalSounds(): Promise<void> {
    const criticalSounds = ['shootBasic', 'explosion', 'powerUp'];
    
    for (const soundKey of criticalSounds) {
      const sound = this.sounds[soundKey];
      if (sound) {
        try {
          // Preload by playing at 0 volume
          await sound.setVolumeAsync(0);
          await sound.playAsync();
          await sound.stopAsync();
          await sound.setVolumeAsync(this.sfxVolume);
        } catch (error) {
          console.warn(`Failed to preload sound: ${soundKey}`, error);
        }
      }
    }
  }
}