import { Card, GameState, Player, CardColor } from '../types/game';
import { GameClient } from '../lib/socketConfig';

export class AIPlayer {
  private static readonly DELAY = 1000; // Tiempo de espera para simular "pensamiento"

  static async playTurn(gameState: GameState, aiPlayer: Player, gameClient: GameClient): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.DELAY));

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const playableCards = aiPlayer.cards.filter(card => 
      this.canPlayCard(card, topCard)
    );

    if (playableCards.length === 0) {
      // Si no hay cartas jugables, robar y verificar si la carta robada se puede jugar
      await gameClient.drawCard(gameState.id, aiPlayer.id);
      
      // Esperar un momento para que se actualice el estado del juego
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar si la última carta robada se puede jugar
      const lastDrawnCard = aiPlayer.cards[aiPlayer.cards.length - 1];
      if (lastDrawnCard && this.canPlayCard(lastDrawnCard, topCard)) {
        // Si la carta robada se puede jugar, jugarla
        if (lastDrawnCard.type === 'wild' || lastDrawnCard.type === 'wildDraw4') {
          const color = this.getMostFrequentColor(aiPlayer.cards);
          await gameClient.playCard(gameState.id, aiPlayer.id, lastDrawnCard, color);
        } else {
          await gameClient.playCard(gameState.id, aiPlayer.id, lastDrawnCard);
        }
      }
      return;
    }

    // Elegir la mejor carta para jugar
    const cardToPlay = this.chooseBestCard(playableCards, aiPlayer.cards);
    
    // Si es una carta wild, elegir el color más frecuente
    if (cardToPlay.type === 'wild' || cardToPlay.type === 'wildDraw4') {
      const color = this.getMostFrequentColor(aiPlayer.cards);
      await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay, color);
    } else {
      await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay);
    }

    // Llamar UNO si corresponde
    if (aiPlayer.cards.length === 2) {
      await gameClient.callUno(gameState.id, aiPlayer.id);
    }
  }

  private static chooseBestCard(playableCards: Card[], allCards: Card[]): Card {
    // Prioridad de cartas:
    // 1. Cartas de acción (skip, reverse, draw2)
    // 2. Wild Draw 4 si tenemos muchas cartas de un color diferente
    // 3. Wild normal
    // 4. Cartas numéricas del color más frecuente
    // 5. Cualquier carta numérica

    // Primero intentar cartas de acción
    const actionCard = playableCards.find(card => 
      ['skip', 'reverse', 'draw2'].includes(card.type)
    );
    if (actionCard) return actionCard;

    // Si tenemos Wild Draw 4 y muchas cartas de un color diferente
    const wildDraw4 = playableCards.find(card => card.type === 'wildDraw4');
    if (wildDraw4 && this.shouldPlayWildDraw4(allCards)) return wildDraw4;

    // Wild normal
    const wild = playableCards.find(card => card.type === 'wild');
    if (wild) return wild;

    // Intentar jugar una carta del color más frecuente
    const mostFrequentColor = this.getMostFrequentColor(allCards);
    const colorCard = playableCards.find(card => card.color === mostFrequentColor);
    if (colorCard) return colorCard;

    // Por defecto, jugar la primera carta disponible
    return playableCards[0];
  }

  private static shouldPlayWildDraw4(cards: Card[]): boolean {
    const colorCounts = this.getColorCounts(cards);
    const dominantColor = this.getMostFrequentColor(cards);
    return colorCounts[dominantColor] >= cards.length * 0.6; // 60% o más de las cartas son del mismo color
  }

  private static canPlayCard(card: Card, topCard: Card): boolean {
    if (card.type === 'wild' || card.type === 'wildDraw4') return true;
    if (card.color === topCard.color) return true;
    if (card.type === topCard.type) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    return false;
  }

  private static getColorCounts(cards: Card[]): Record<CardColor, number> {
    return cards.reduce((acc, card) => {
      if (card.color !== 'black') {
        acc[card.color] = (acc[card.color] || 0) + 1;
      }
      return acc;
    }, {} as Record<CardColor, number>);
  }

  private static getMostFrequentColor(cards: Card[]): CardColor {
    const colorCount = this.getColorCounts(cards);
    return Object.entries(colorCount).reduce((maxColor, [color, count]) => 
      count > (colorCount[maxColor as CardColor] || 0) ? color as CardColor : maxColor
    , 'red' as CardColor);
  }
} 