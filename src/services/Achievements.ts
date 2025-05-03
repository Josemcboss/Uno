import SoundEffects from './SoundEffects';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

class Achievements {
  private static achievements: Achievement[] = [
    {
      id: 'first_win',
      title: '¡Primera Victoria!',
      description: 'Gana tu primera partida',
      icon: '🏆',
      unlocked: false
    },
    {
      id: 'uno_master',
      title: 'Maestro del UNO',
      description: 'Di "UNO" 10 veces',
      icon: '🎯',
      unlocked: false,
      progress: 0,
      maxProgress: 10
    },
    {
      id: 'wild_cards',
      title: 'Domador de Comodines',
      description: 'Usa 20 cartas comodín',
      icon: '🃏',
      unlocked: false,
      progress: 0,
      maxProgress: 20
    },
    {
      id: 'winning_streak',
      title: 'Racha Ganadora',
      description: 'Gana 3 partidas seguidas',
      icon: '🔥',
      unlocked: false,
      progress: 0,
      maxProgress: 3
    },
    {
      id: 'ai_victory',
      title: 'Victoria contra IA',
      description: 'Gana una partida contra la IA',
      icon: '🤖',
      unlocked: false
    }
  ];

  static initialize() {
    // Cargar logros guardados
    const savedAchievements = localStorage.getItem('uno_achievements');
    if (savedAchievements) {
      this.achievements = JSON.parse(savedAchievements);
    }
  }

  static save() {
    localStorage.setItem('uno_achievements', JSON.stringify(this.achievements));
  }

  static getAll(): Achievement[] {
    return this.achievements;
  }

  static unlock(achievementId: string) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.save();
      SoundEffects.play('achievement');
      return achievement;
    }
    return null;
  }

  static updateProgress(achievementId: string, progress: number) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked && achievement.maxProgress) {
      achievement.progress = Math.min(progress, achievement.maxProgress);
      if (achievement.progress >= achievement.maxProgress) {
        return this.unlock(achievementId);
      }
      this.save();
    }
    return null;
  }

  static checkGameEndAchievements(won: boolean, againstAI: boolean, streak: number) {
    const unlockedAchievements: Achievement[] = [];

    if (won) {
      const firstWin = this.unlock('first_win');
      if (firstWin) unlockedAchievements.push(firstWin);

      if (againstAI) {
        const aiVictory = this.unlock('ai_victory');
        if (aiVictory) unlockedAchievements.push(aiVictory);
      }

      if (streak >= 3) {
        const streakAchievement = this.unlock('winning_streak');
        if (streakAchievement) unlockedAchievements.push(streakAchievement);
      }
    }

    return unlockedAchievements;
  }
}

export default Achievements; 