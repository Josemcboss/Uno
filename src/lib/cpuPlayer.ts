import { Card, GameState, CardColor } from '../types/game';
import { isValidPlay } from './game';

export class CPUPlayer {
  private getRandomDelay(): number {
    return Math.random() * 1000 + 1000; // Delay entre 1-2 segundos
  }

  private getValidCards(cards: Card[], lastCard: Card): Card[] {
    return cards.filter(card => isValidPlay(card, lastCard));
  }

  private selectBestCard(validCards: Card[], playerCards: Card[]): Card {
    // Estrategia: Priorizar cartas especiales y cartas del color más común en la mano

    // 1. Priorizar cartas Wild Draw 4 si tenemos muchas cartas (último recurso)
    if (playerCards.length > 5) {
      const wildDraw4 = validCards.find(card => card.type === 'wildDraw4');
      if (wildDraw4) return wildDraw4;
    }

    // 2. Priorizar cartas Draw 2
    const draw2Cards = validCards.filter(card => card.type === 'draw2');
    if (draw2Cards.length > 0) {
      return draw2Cards[Math.floor(Math.random() * draw2Cards.length)];
    }

    // 3. Priorizar cartas Skip y Reverse
    const actionCards = validCards.filter(card => 
      card.type === 'skip' || card.type === 'reverse'
    );
    if (actionCards.length > 0) {
      return actionCards[Math.floor(Math.random() * actionCards.length)];
    }

    // 4. Obtener color más frecuente en nuestra mano
    const mostFrequentColor = this.getMostFrequentColor(playerCards);

    // 5. Priorizar cartas numéricas del color más frecuente
    const colorCards = validCards.filter(
      card => card.color === mostFrequentColor && card.type === 'number'
    );
    if (colorCards.length > 0) {
      return colorCards[Math.floor(Math.random() * colorCards.length)];
    }

    // 6. Priorizar cartas Wild normales
    const wildCards = validCards.filter(card => card.type === 'wild');
    if (wildCards.length > 0) {
      return wildCards[Math.floor(Math.random() * wildCards.length)];
    }

    // 7. Usar cualquier carta válida si no hay mejor opción
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

    let maxColor: CardColor = 'red';
    let maxCount = 0;

    // Encontrar el color con más cartas
    (Object.keys(colorCount) as CardColor[]).forEach(color => {
      if (color !== 'black' && colorCount[color] > maxCount) {
        maxColor = color;
        maxCount = colorCount[color];
      }
    });

    return maxColor;
  }

  async playTurn(gameState: GameState, playerId: string): Promise<{
    action: 'play' | 'draw';
    card?: Card;
    selectedColor?: CardColor;
  }> {
    // Simular "pensamiento" del CPU
    await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !gameState.lastCard) return { action: 'draw' };

    const validCards = this.getValidCards(player.cards, gameState.lastCard);

    if (validCards.length === 0) {
      return { action: 'draw' };
    }

    const selectedCard = this.selectBestCard(validCards, player.cards);

    // Si es una carta wild, seleccionar el color más frecuente en la mano
    if (selectedCard.type === 'wild' || selectedCard.type === 'wildDraw4') {
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