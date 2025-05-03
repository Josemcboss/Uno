class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.sounds = {
      playCard: new Audio('/sounds/play-card.mp3'),
      drawCard: new Audio('/sounds/draw-card.mp3'),
      gameWin: new Audio('/sounds/game-win.mp3'),
      uno: new Audio('/sounds/uno.mp3'),
      message: new Audio('/sounds/message.mp3'),
    };
  }

  play(soundName: keyof typeof this.sounds) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Manejar error silenciosamente (navegadores pueden bloquear autoplay)
      });
    }
  }
}

export const soundManager = new SoundManager(); 