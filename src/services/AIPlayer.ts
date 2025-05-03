import { Card, GameState, Player, CardColor } from '../types/game';
import { GameClient } from '../lib/socketConfig';

export class AIPlayer {
  private static readonly DELAY = 400; // Reducido para acelerar el juego

  static async playTurn(gameState: GameState, aiPlayer: Player, gameClient: GameClient): Promise<void> {
    try {
      console.log('IA iniciando turno:', {
        aiName: aiPlayer.name,
        cardsCount: aiPlayer.cards.length,
        currentPlayerIdx: gameState.currentPlayerIndex,
      });

      // Pausa breve para simular "pensamiento"
      await new Promise(resolve => setTimeout(resolve, this.DELAY));

      // Obtener la carta superior y determinar jugadas posibles
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const playableCards = aiPlayer.cards.filter(card => 
        this.canPlayCard(card, topCard)
      );

      console.log('Cartas jugables:', playableCards.length, 'de', aiPlayer.cards.length);

      // Si no hay cartas jugables, robar
      if (playableCards.length === 0) {
        console.log('IA roba carta');
        await gameClient.drawCard(gameState.id, aiPlayer.id);
        return;
      }

      // Si la IA va a quedarse con una carta (tiene 2 ahora), llamar UNO primero
      if (aiPlayer.cards.length === 2 && !aiPlayer.calledUno) {
        console.log('IA llama UNO preventivamente');
        await gameClient.callUno(gameState.id, aiPlayer.id);
        // Pequeña pausa para asegurar que el servidor procese la llamada a UNO
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Elegir la mejor carta para jugar
      const cardToPlay = this.chooseBestCard(playableCards, aiPlayer.cards);
      console.log('IA jugará:', 
        cardToPlay.type === 'number' 
          ? `${cardToPlay.color} ${cardToPlay.value}` 
          : `${cardToPlay.color || 'black'} ${cardToPlay.type}`
      );
      
      // Pequeña pausa antes de jugar
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Si es una carta wild, elegir el color más frecuente
      if (cardToPlay.type === 'wild' || cardToPlay.type === 'wildDraw4') {
        const color = this.getMostFrequentColor(aiPlayer.cards);
        console.log('IA elige color:', color);
        await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay, color);
      } else {
        await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay);
      }

      // Verificar si después de jugar la carta quedaría con una sola carta, y no ha llamado UNO aún
      if (aiPlayer.cards.length === 2 && !aiPlayer.calledUno) {
        console.log('IA llama UNO después de jugar');
        await gameClient.callUno(gameState.id, aiPlayer.id);
      }
      
      console.log('IA completó su turno');
    } catch (error) {
      console.error('Error en el turno de la IA:', error);
    }
  }

  private static chooseBestCard(playableCards: Card[], allCards: Card[]): Card {
    // Prioridad de cartas:
    // 1. Cartas de acción (skip, reverse, draw2) si hay más de 2 jugadores
    // 2. Wild Draw 4 si tenemos muchas cartas de un color diferente
    // 3. Wild normal si tenemos cartas de diferentes colores
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

    // Wild normal si tenemos cartas de diferentes colores
    const wild = playableCards.find(card => card.type === 'wild');
    if (wild && this.shouldPlayWild(allCards)) return wild;

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

  private static shouldPlayWild(cards: Card[]): boolean {
    const colors = Object.keys(this.getColorCounts(cards)).length;
    return colors >= 3; // Tenemos cartas de 3 o más colores diferentes
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