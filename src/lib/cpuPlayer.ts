import { Card, GameState, CardColor } from '../types/game';
import { isValidPlay, getValidCards } from './gameLogic';

export class CPUPlayer {
  private getRandomDelay(): number {
    return Math.random() * 1000 + 1000; // Delay entre 1-2 segundos
  }

  private selectBestCard(validCards: Card[], currentCard: Card): Card {
    // Priorizar cartas especiales
    const specialCards = validCards.filter(card => card.type !== 'number');
    if (specialCards.length > 0) {
      return specialCards[Math.floor(Math.random() * specialCards.length)];
    }

    // Si no hay cartas especiales, usar cualquier carta válida
    return validCards[Math.floor(Math.random() * validCards.length)];
  }

  private getMostFrequentColor(cards: Card[]): CardColor {
    const colorCount: Record<CardColor, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
      black: 0
    };

    cards.forEach(card => {
      if (card.color !== 'black') {
        colorCount[card.color]++;
      }
    });

    return Object.entries(colorCount).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0] as CardColor;
  }

  async playTurn(gameState: GameState, playerId: string): Promise<{
    action: 'play' | 'draw';
    card?: Card;
    selectedColor?: CardColor;
  }> {
    // Simular "pensamiento" del CPU
    await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { action: 'draw' };

    const validCards = getValidCards(player.cards, gameState.currentCard);

    if (validCards.length === 0) {
      return { action: 'draw' };
    }

    const selectedCard = this.selectBestCard(validCards, gameState.currentCard);

    // Si es una carta wild, seleccionar el color más frecuente en la mano
    if (selectedCard.type === 'wild' || selectedCard.type === 'wild4') {
      const selectedColor = this.getMostFrequentColor(player.cards);
      return {
        action: 'play',
        card: selectedCard,
        selectedColor
      };
    }

    return {
      action: 'play',
      card: selectedCard
    };
  }
} 