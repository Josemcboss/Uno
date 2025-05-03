import { v4 as uuidv4 } from 'uuid';
import type { Card, CardColor, CardType, GameState, Player } from '../types/game';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  // Crear cartas numéricas (del 0 al 9, dos de cada excepto el 0)
  COLORS.forEach(color => {
    NUMBERS.forEach(number => {
      const card: Card = { id: uuidv4(), color, type: 'number', value: number };
      deck.push(card);
      if (number !== 0) {
        deck.push({ ...card, id: uuidv4() });
      }
    });
  });

  // Crear cartas especiales (2 de cada por color)
  COLORS.forEach(color => {
    ['skip', 'reverse', 'draw2'].forEach(type => {
      deck.push({ id: uuidv4(), color, type: type as CardType });
      deck.push({ id: uuidv4(), color, type: type as CardType });
    });
  });

  // Crear cartas comodín (4 wild, 4 wildDraw4)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'black', type: 'wild' });
    deck.push({ id: uuidv4(), color: 'black', type: 'wildDraw4' });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createGame(hostId: string, hostName: string): GameState {
  const deck = createDeck();
  const players: Player[] = [{
    id: hostId,
    name: hostName,
    cards: [],
    isHost: true
  }];

  return {
    id: uuidv4(),
    players,
    currentPlayerIndex: 0,
    deck,
    discardPile: [],
    direction: 1,
    lastCard: null,
    status: 'waiting',
    winner: null
  };
}

export function dealInitialCards(game: GameState): GameState {
  const updatedGame = { ...game };
  
  // Dar 7 cartas a cada jugador
  updatedGame.players.forEach(player => {
    player.cards = updatedGame.deck.splice(0, 7);
  });

  // Poner la primera carta en el montón de descarte
  const firstCard = updatedGame.deck.pop();
  if (firstCard) {
    updatedGame.discardPile = [firstCard];
    updatedGame.lastCard = firstCard;
  }

  return updatedGame;
}

export function isValidPlay(card: Card, lastCard: Card): boolean {
  if (card.color === 'black') return true; // Comodines siempre son válidos
  if (card.color === lastCard.color) return true; // Mismo color
  if (card.type === 'number' && lastCard.type === 'number' && card.value === lastCard.value) return true; // Mismo número
  if (card.type === lastCard.type) return true; // Mismo tipo de carta especial
  return false;
}

export function playCard(game: GameState, playerId: string, cardId: string, newColor?: CardColor): GameState {
  const updatedGame = { ...game };
  const player = updatedGame.players.find(p => p.id === playerId);
  if (!player) return game;

  const cardIndex = player.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return game;

  const card = player.cards[cardIndex];
  if (!updatedGame.lastCard || !isValidPlay(card, updatedGame.lastCard)) return game;

  // Remover la carta de la mano del jugador
  player.cards.splice(cardIndex, 1);

  // Aplicar efectos de la carta
  switch (card.type) {
    case 'skip':
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
    case 'reverse':
      updatedGame.direction *= -1;
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
      break;
    case 'draw2':
      const nextPlayer = updatedGame.players[getNextPlayerIndex(updatedGame, 1)];
      nextPlayer.cards.push(...updatedGame.deck.splice(0, 2));
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
    case 'wild':
      if (newColor && COLORS.includes(newColor)) {
        card.color = newColor;
      }
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
      break;
    case 'wildDraw4':
      if (newColor && COLORS.includes(newColor)) {
        card.color = newColor;
      }
      const nextPlayerDraw4 = updatedGame.players[getNextPlayerIndex(updatedGame, 1)];
      nextPlayerDraw4.cards.push(...updatedGame.deck.splice(0, 4));
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
    default:
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
  }

  // Actualizar el estado del juego
  updatedGame.discardPile.push(card);
  updatedGame.lastCard = card;

  // Verificar si el jugador ganó
  if (player.cards.length === 0) {
    updatedGame.status = 'finished';
    updatedGame.winner = playerId;
  }

  // Verificar si necesitamos rebarajar
  if (updatedGame.deck.length < 4) {
    const lastCard = updatedGame.discardPile.pop()!;
    updatedGame.deck = shuffleDeck(updatedGame.discardPile);
    updatedGame.discardPile = [lastCard];
  }

  return updatedGame;
}

function getNextPlayerIndex(game: GameState, steps: number): number {
  const totalPlayers = game.players.length;
  return (game.currentPlayerIndex + (steps * game.direction) + totalPlayers) % totalPlayers;
}

export function drawCard(game: GameState, playerId: string): GameState {
  const updatedGame = { ...game };
  const player = updatedGame.players.find(p => p.id === playerId);
  if (!player) return game;

  if (updatedGame.deck.length === 0) {
    if (updatedGame.discardPile.length > 1) {
      const lastCard = updatedGame.discardPile.pop()!;
      updatedGame.deck = shuffleDeck(updatedGame.discardPile);
      updatedGame.discardPile = [lastCard];
    } else {
      return game; // No hay cartas para robar
    }
  }

  const drawnCard = updatedGame.deck.pop()!;
  player.cards.push(drawnCard);

  // Si no es el turno del jugador o la carta robada no se puede jugar,
  // pasar al siguiente jugador
  if (!updatedGame.lastCard || !isValidPlay(drawnCard, updatedGame.lastCard)) {
    updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
  }

  return updatedGame;
} 