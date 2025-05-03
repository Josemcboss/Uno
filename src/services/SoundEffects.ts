class SoundEffects {
  private static sounds: { [key: string]: HTMLAudioElement } = {};
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    this.sounds = {
      cardPlay: new Audio('/sounds/card-play.mp3'),
      cardDraw: new Audio('/sounds/card-draw.mp3'),
      shuffle: new Audio('/sounds/shuffle.mp3'),
      uno: new Audio('/sounds/uno.mp3'),
      victory: new Audio('/sounds/victory.mp3'),
      gameStart: new Audio('/sounds/game-start.mp3'),
      achievement: new Audio('/sounds/achievement.mp3'),
    };

    // Precarga de sonidos
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });

    this.initialized = true;
  }

  static play(soundName: keyof typeof SoundEffects['sounds']) {
    if (!this.initialized) this.initialize();
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.warn('Error playing sound:', err));
    }
  }

  static setVolume(volume: number) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

export default SoundEffects; 