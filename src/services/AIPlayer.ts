import { Card, GameState, Player, CardColor } from '../types/game';

export class AIPlayer {
  private static readonly DELAY = 1000; // Tiempo de espera para simular "pensamiento"

  static async makeMove(gameState: GameState, aiPlayer: Player): Promise<{
    action: 'play' | 'draw';
    card?: Card;
    color?: CardColor;
  }> {
    await new Promise(resolve => setTimeout(resolve, this.DELAY));

    const playableCards = aiPlayer.cards.filter(card => 
      this.canPlayCard(card, gameState.discardPile[gameState.discardPile.length - 1])
    );

    if (playableCards.length === 0) {
      return { action: 'draw' };
    }

    // Estrategia simple: jugar la primera carta válida
    const cardToPlay = playableCards[0];
    
    // Si es una carta wild, elegir el color más frecuente en la mano
    if (cardToPlay.type === 'wild' || cardToPlay.type === 'wildDraw4') {
      const color = this.getMostFrequentColor(aiPlayer.cards);
      return { action: 'play', card: cardToPlay, color };
    }

    return { action: 'play', card: cardToPlay };
  }

  private static canPlayCard(card: Card, topCard: Card): boolean {
    if (card.type === 'wild' || card.type === 'wildDraw4') return true;
    if (card.color === topCard.color) return true;
    if (card.type === topCard.type) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    return false;
  }

  private static getMostFrequentColor(cards: Card[]): CardColor {
    const colorCount = cards.reduce((acc, card) => {
      if (card.color !== 'black') {
        acc[card.color] = (acc[card.color] || 0) + 1;
      }
      return acc;
    }, {} as Record<CardColor, number>);

    return Object.entries(colorCount).reduce((maxColor, [color, count]) => 
      count > (colorCount[maxColor as CardColor] || 0) ? color as CardColor : maxColor
    , 'red' as CardColor);
  }
} 