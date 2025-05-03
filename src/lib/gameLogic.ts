import { v4 as uuidv4 } from 'uuid';
import { Card, CardColor, CardType, GameState, Player } from '../types/game';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SPECIAL_CARDS: CardType[] = ['skip', 'reverse', 'draw2'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];

  // Añadir cartas numéricas (del 0 al 9)
  COLORS.forEach(color => {
    NUMBERS.forEach(num => {
      // Solo una carta 0 por color
      const count = num === 0 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: uuidv4(),
          color,
          type: 'number',
          value: num
        });
      }
    });
  });

  // Añadir cartas especiales (Skip, Reverse, Draw Two)
  COLORS.forEach(color => {
    SPECIAL_CARDS.forEach(type => {
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: uuidv4(),
          color,
          type
        });
      }
    });
  });

  // Añadir cartas Wild y Wild Draw Four
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: uuidv4(),
      color: 'black',
      type: 'wild'
    });
    deck.push({
      id: uuidv4(),
      color: 'black',
      type: 'wildDraw4'
    });
  }

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const dealCards = (deck: Card[]): {
  players: Player[];
  remainingDeck: Card[];
  lastCard: Card;
} => {
  const players: Player[] = [];
  const newDeck = [...deck];

  // Dar 7 cartas a cada jugador
  for (let i = 0; i < 2; i++) {
    const cards = newDeck.splice(0, 7);
    players.push({
      id: uuidv4(),
      name: `Player ${i + 1}`,
      cards,
      isHost: i === 0
    });
  }

  // Tomar la primera carta que no sea wild o wildDraw4 como carta inicial
  let lastCard: Card;
  let lastCardIndex = newDeck.findIndex(
    card => card.type !== 'wild' && card.type !== 'wildDraw4'
  );
  lastCard = newDeck.splice(lastCardIndex, 1)[0];

  return {
    players,
    remainingDeck: newDeck,
    lastCard
  };
};

export function isValidPlay(card: Card, lastCard: Card): boolean {
  if (card.color === 'black') return true; // Comodines siempre son válidos
  if (card.color === lastCard.color) return true; // Mismo color
  if (card.type === 'number' && lastCard.type === 'number' && card.value === lastCard.value) return true; // Mismo número
  if (card.type === lastCard.type) return true; // Mismo tipo de carta especial
  return false;
}

export function getValidCards(cards: Card[], lastCard: Card): Card[] {
  return cards.filter(card => isValidPlay(card, lastCard));
}

export const createNewGame = (hostId: string, hostName: string): GameState => {
  const deck = createDeck();
  const { players, remainingDeck, lastCard } = dealCards(deck);

  return {
    id: uuidv4(),
    players,
    currentPlayerIndex: 0,
    deck: remainingDeck,
    discardPile: [lastCard],
    direction: 1,
    lastCard,
    status: 'waiting',
    winner: null
  };
};

export interface GameAction {
  type: 'play' | 'draw' | 'skip';
  card?: Card;
  playerId: string;
  selectedColor?: CardColor;
}

export const handleSpecialCard = (game: GameState, action: GameAction): GameState => {
  const currentPlayerIndex = game.players.findIndex(p => p.id === action.playerId);
  const nextPlayerIndex = game.direction === 1
    ? (currentPlayerIndex + 1) % game.players.length 
    : (currentPlayerIndex - 1 + game.players.length) % game.players.length;

  const updatedGame = { ...game };

  switch (action.card?.type) {
    case 'skip':
      // Salta al siguiente jugador
      updatedGame.currentPlayerIndex = (nextPlayerIndex + game.direction + game.players.length) % game.players.length;
      break;

    case 'reverse':
      // Cambia la dirección del juego
      updatedGame.direction *= -1;
      updatedGame.currentPlayerIndex = nextPlayerIndex;
      break;

    case 'draw2':
      // El siguiente jugador roba 2 cartas y pierde su turno
      const nextPlayer = updatedGame.players[nextPlayerIndex];
      const cardsToAdd = updatedGame.deck.splice(0, 2);
      nextPlayer.cards = [...nextPlayer.cards, ...cardsToAdd];
      updatedGame.currentPlayerIndex = (nextPlayerIndex + game.direction + game.players.length) % game.players.length;
      break;

    case 'wild':
      // Cambia el color
      if (action.selectedColor) {
        const newCard = { ...action.card, color: action.selectedColor };
        updatedGame.lastCard = newCard;
        updatedGame.discardPile.push(newCard);
      }
      updatedGame.currentPlayerIndex = nextPlayerIndex;
      break;

    case 'wildDraw4':
      // Cambia el color y el siguiente jugador roba 4 cartas
      if (action.selectedColor) {
        const newCard = { ...action.card, color: action.selectedColor };
        updatedGame.lastCard = newCard;
        updatedGame.discardPile.push(newCard);
      }
      const nextPlayerWild4 = updatedGame.players[nextPlayerIndex];
      const cardsToAddWild4 = updatedGame.deck.splice(0, 4);
      nextPlayerWild4.cards = [...nextPlayerWild4.cards, ...cardsToAddWild4];
      updatedGame.currentPlayerIndex = (nextPlayerIndex + game.direction + game.players.length) % game.players.length;
      break;

    default:
      // Carta normal
      updatedGame.currentPlayerIndex = nextPlayerIndex;
  }

  return updatedGame;
};

export const drawCard = (game: GameState, playerId: string): GameState => {
  const updatedGame = { ...game };
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  
  if (playerIndex === updatedGame.currentPlayerIndex) {
    const drawnCard = updatedGame.deck.shift();
    if (drawnCard) {
      updatedGame.players[playerIndex].cards.push(drawnCard);
    }
    
    // Si el mazo está vacío, barajar el descarte
    if (updatedGame.deck.length === 0 && updatedGame.discardPile.length > 1) {
      const lastCard = updatedGame.discardPile.pop()!;
      updatedGame.deck = shuffleDeck(updatedGame.discardPile);
      updatedGame.discardPile = [lastCard];
    }

    // Pasar al siguiente jugador
    updatedGame.currentPlayerIndex = (playerIndex + updatedGame.direction + updatedGame.players.length) % updatedGame.players.length;
  }
  
  return updatedGame;
};

export interface GameRules {
  stackDrawCards: boolean; // Permitir apilar +2 sobre +2 y +4 sobre +4
  forcePlay: boolean; // Forzar a jugar una carta si es posible
  playAfterDraw: boolean; // Permitir jugar después de robar
  timeLimit: number; // Límite de tiempo por turno en segundos (0 = sin límite)
}

export const DEFAULT_RULES: GameRules = {
  stackDrawCards: true,
  forcePlay: false,
  playAfterDraw: true,
  timeLimit: 30,
};

export const canPlayAnyCard = (playerCards: Card[], lastCard: Card): boolean => {
  return playerCards.some(card => isValidPlay(card, lastCard));
};

export const shouldCallUno = (player: Player): boolean => {
  return player.cards.length === 1;
};

export const calculatePoints = (cards: Card[]): number => {
  return cards.reduce((total, card) => {
    if (card.type === 'number') {
      return total + (card.value || 0);
    }
    if (card.type === 'wild' || card.type === 'wildDraw4') {
      return total + 50;
    }
    return total + 20; // Para skip, reverse, draw2
  }, 0);
};

export const isStackingAllowed = (
  card: Card,
  lastCard: Card,
  rules: GameRules
): boolean => {
  if (!rules.stackDrawCards) return false;
  
  if (lastCard.type === 'draw2' && card.type === 'draw2') return true;
  if (lastCard.type === 'wildDraw4' && card.type === 'wildDraw4') return true;
  
  return false;
};

export const handleTimeLimit = (
  game: GameState,
  rules: GameRules
): GameState | null => {
  if (rules.timeLimit === 0) return null;

  const currentPlayer = game.players.find(p => p.isHost);
  if (!currentPlayer) return null;

  // Si el jugador no juega en el tiempo límite, roba una carta y pierde el turno
  const updatedGame = drawCard(game, currentPlayer.id);
  const nextPlayerIndex = game.players.findIndex(p => p.id === currentPlayer.id) + 1;
  
  updatedGame.players[nextPlayerIndex % updatedGame.players.length].isHost = true;
  currentPlayer.isHost = false;

  return updatedGame;
}; 