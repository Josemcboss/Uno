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
        aiPlayerIdx: gameState.players.findIndex(p => p.id === aiPlayer.id)
      });

      // Verificación adicional del turno de la IA
      const aiPlayerIndex = gameState.players.findIndex(p => p.id === aiPlayer.id);
      if (aiPlayerIndex !== gameState.currentPlayerIndex) {
        console.log('No es el turno de la IA - verificación inicial fallida');
        return;
      }

      // Primera pausa para simular "pensamiento"
      await new Promise(resolve => setTimeout(resolve, this.DELAY));

      // Verificar de nuevo el estado del juego para asegurarnos de que no haya cambiado
      const refreshedGameState = await gameClient.getGameState(gameState.id);
      if (!refreshedGameState) {
        console.log('No se pudo obtener el estado actualizado del juego');
        return;
      }

      // Verificar que siga siendo el turno de la IA
      const updatedAiPlayerIndex = refreshedGameState.players.findIndex(p => p.id === aiPlayer.id);
      if (updatedAiPlayerIndex !== refreshedGameState.currentPlayerIndex) {
        console.log('No es el turno de la IA - verificación posterior fallida');
        return;
      }

      const refreshedAiPlayer = refreshedGameState.players[updatedAiPlayerIndex];
      const topCard = refreshedGameState.discardPile[refreshedGameState.discardPile.length - 1];
      
      // Determinar cartas jugables
      const playableCards = refreshedAiPlayer.cards.filter(card => 
        this.canPlayCard(card, topCard)
      );

      console.log('Cartas jugables de la IA:', {
        total: refreshedAiPlayer.cards.length,
        playable: playableCards.length,
        topCard: `${topCard.color || 'black'} ${topCard.type}${topCard.value !== undefined ? ' ' + topCard.value : ''}`
      });

      // Si no hay cartas jugables, robar
      if (playableCards.length === 0) {
        console.log('IA necesita robar carta');
        
        // Verificar una vez más que siga siendo nuestro turno
        const preDrawGameState = await gameClient.getGameState(gameState.id);
        if (!preDrawGameState || preDrawGameState.currentPlayerIndex !== updatedAiPlayerIndex) {
          console.log('Ya no es el turno de la IA antes de robar');
          return;
        }
        
        await gameClient.drawCard(gameState.id, aiPlayer.id);
        console.log('IA ha robado una carta');
        
        // Esperar un momento para que se actualice el estado del juego
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verificar si la carta robada se puede jugar
        const postDrawGameState = await gameClient.getGameState(gameState.id);
        if (!postDrawGameState) {
          console.log('No se pudo obtener el estado después de robar');
          return;
        }

        // Verificar si todavía es el turno de la IA después de robar
        const postDrawAiIndex = postDrawGameState.players.findIndex(p => p.id === aiPlayer.id);
        if (postDrawAiIndex !== postDrawGameState.currentPlayerIndex) {
          console.log('Ya no es el turno de la IA después de robar');
          return;
        }

        const postDrawAiPlayer = postDrawGameState.players[postDrawAiIndex];
        const lastDrawnCard = postDrawAiPlayer.cards[postDrawAiPlayer.cards.length - 1];
        
        // Verificar si la carta robada se puede jugar
        if (lastDrawnCard && this.canPlayCard(lastDrawnCard, topCard)) {
          console.log('IA puede jugar la carta recién robada');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verificar una vez más antes de jugar
          const finalCheckState = await gameClient.getGameState(gameState.id);
          if (!finalCheckState || finalCheckState.currentPlayerIndex !== postDrawAiIndex) {
            console.log('Ya no es el turno de la IA antes de jugar carta robada');
            return;
          }
          
          if (lastDrawnCard.type === 'wild' || lastDrawnCard.type === 'wildDraw4') {
            const color = this.getMostFrequentColor(postDrawAiPlayer.cards);
            console.log(`IA jugando carta robada wild con color ${color}`);
            await gameClient.playCard(gameState.id, aiPlayer.id, lastDrawnCard, color);
          } else {
            console.log('IA jugando carta robada normal');
            await gameClient.playCard(gameState.id, aiPlayer.id, lastDrawnCard);
          }
          
          // Verificar si hay que llamar UNO
          if (postDrawAiPlayer.cards.length === 2) {
            await gameClient.callUno(gameState.id, aiPlayer.id);
          }
        } else {
          console.log('IA no puede jugar la carta robada, pasando turno');
        }
        return;
      }

      // Elegir la mejor carta para jugar
      const cardToPlay = this.chooseBestCard(playableCards, refreshedAiPlayer.cards);
      console.log('IA eligió jugar:', {
        card: `${cardToPlay.color || 'black'} ${cardToPlay.type}${cardToPlay.value !== undefined ? ' ' + cardToPlay.value : ''}`
      });
      
      // Verificar de nuevo que siga siendo nuestro turno antes de jugar
      const finalGameState = await gameClient.getGameState(gameState.id);
      if (!finalGameState || finalGameState.currentPlayerIndex !== updatedAiPlayerIndex) {
        console.log('Ya no es el turno de la IA antes de jugar carta elegida');
        return;
      }
      
      // Si es una carta wild, elegir el color más frecuente
      if (cardToPlay.type === 'wild' || cardToPlay.type === 'wildDraw4') {
        const color = this.getMostFrequentColor(refreshedAiPlayer.cards);
        console.log('IA eligiendo color para carta wild:', color);
        await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay, color);
      } else {
        await gameClient.playCard(gameState.id, aiPlayer.id, cardToPlay);
      }

      // Llamar UNO si corresponde
      if (refreshedAiPlayer.cards.length === 2) {
        console.log('IA llamando UNO');
        await gameClient.callUno(gameState.id, aiPlayer.id);
      }
      
      console.log('IA completó su turno con éxito');
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