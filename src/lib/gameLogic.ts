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
      type: 'wild4'
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

export const dealCards = (deck: Card[], numPlayers: number): {
  players: Player[];
  remainingDeck: Card[];
  currentCard: Card;
} => {
  const players: Player[] = [];
  const newDeck = [...deck];

  // Dar 7 cartas a cada jugador
  for (let i = 0; i < numPlayers; i++) {
    const cards = newDeck.splice(0, 7);
    players.push({
      id: uuidv4(),
      name: `Player ${i + 1}`,
      cards,
      isCurrentTurn: i === 0
    });
  }

  // Tomar la primera carta que no sea wild o wild4 como carta inicial
  let currentCard: Card;
  let currentCardIndex = newDeck.findIndex(
    card => card.type !== 'wild' && card.type !== 'wild4'
  );
  currentCard = newDeck.splice(currentCardIndex, 1)[0];

  return {
    players,
    remainingDeck: newDeck,
    currentCard
  };
};

export const isValidPlay = (card: Card, currentCard: Card): boolean => {
  // Wild cards can always be played
  if (card.type === 'wild' || card.type === 'wild4') {
    return true;
  }

  // Match color or type/value
  return (
    card.color === currentCard.color ||
    (card.type === currentCard.type && card.type === 'number' && card.value === currentCard.value) ||
    card.type === currentCard.type
  );
};

export const createNewGame = (numPlayers: number): GameState => {
  const deck = createDeck();
  const { players, remainingDeck, currentCard } = dealCards(deck, numPlayers);

  return {
    id: uuidv4(),
    players,
    currentCard,
    deck: remainingDeck,
    direction: 'clockwise',
    status: 'waiting'
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
  const nextPlayerIndex = game.direction === 'clockwise' 
    ? (currentPlayerIndex + 1) % game.players.length 
    : (currentPlayerIndex - 1 + game.players.length) % game.players.length;

  const updatedGame = { ...game };

  switch (action.card?.type) {
    case 'skip':
      // Salta al siguiente jugador
      const skipNextPlayer = game.direction === 'clockwise'
        ? (nextPlayerIndex + 1) % game.players.length
        : (nextPlayerIndex - 1 + game.players.length) % game.players.length;
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[skipNextPlayer].isCurrentTurn = true;
      break;

    case 'reverse':
      // Cambia la dirección del juego
      updatedGame.direction = game.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[nextPlayerIndex].isCurrentTurn = true;
      break;

    case 'draw2':
      // El siguiente jugador roba 2 cartas y pierde su turno
      const nextPlayer = updatedGame.players[nextPlayerIndex];
      const cardsToAdd = updatedGame.deck.splice(0, 2);
      nextPlayer.cards = [...nextPlayer.cards, ...cardsToAdd];
      
      const skipAfterDraw = game.direction === 'clockwise'
        ? (nextPlayerIndex + 1) % game.players.length
        : (nextPlayerIndex - 1 + game.players.length) % game.players.length;
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[skipAfterDraw].isCurrentTurn = true;
      break;

    case 'wild':
      // Cambia el color
      if (action.selectedColor) {
        updatedGame.currentCard = { ...action.card, color: action.selectedColor };
      }
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[nextPlayerIndex].isCurrentTurn = true;
      break;

    case 'wild4':
      // Cambia el color y el siguiente jugador roba 4 cartas
      if (action.selectedColor) {
        updatedGame.currentCard = { ...action.card, color: action.selectedColor };
      }
      const nextPlayerWild4 = updatedGame.players[nextPlayerIndex];
      const cardsToAddWild4 = updatedGame.deck.splice(0, 4);
      nextPlayerWild4.cards = [...nextPlayerWild4.cards, ...cardsToAddWild4];
      
      const skipAfterWild4 = game.direction === 'clockwise'
        ? (nextPlayerIndex + 1) % game.players.length
        : (nextPlayerIndex - 1 + game.players.length) % game.players.length;
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[skipAfterWild4].isCurrentTurn = true;
      break;

    default:
      // Carta normal
      updatedGame.players[currentPlayerIndex].isCurrentTurn = false;
      updatedGame.players[nextPlayerIndex].isCurrentTurn = true;
  }

  return updatedGame;
};

export const drawCard = (game: GameState, playerId: string): GameState => {
  const updatedGame = { ...game };
  const player = updatedGame.players.find(p => p.id === playerId);
  
  if (player && player.isCurrentTurn) {
    const drawnCard = updatedGame.deck.shift();
    if (drawnCard) {
      player.cards.push(drawnCard);
    }
    
    // Si el mazo está vacío, barajar el descarte
    if (updatedGame.deck.length === 0) {
      const currentCard = updatedGame.currentCard;
      updatedGame.deck = shuffleDeck([...updatedGame.deck]);
      updatedGame.currentCard = currentCard;
    }
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

export const canPlayAnyCard = (playerCards: Card[], currentCard: Card): boolean => {
  return playerCards.some(card => isValidPlay(card, currentCard));
};

export const getValidCards = (playerCards: Card[], currentCard: Card): Card[] => {
  return playerCards.filter(card => isValidPlay(card, currentCard));
};

export const shouldCallUno = (player: Player): boolean => {
  return player.cards.length === 1;
};

export const calculatePoints = (cards: Card[]): number => {
  return cards.reduce((total, card) => {
    if (card.type === 'number') {
      return total + (card.value || 0);
    }
    if (card.type === 'wild' || card.type === 'wild4') {
      return total + 50;
    }
    return total + 20; // Para skip, reverse, draw2
  }, 0);
};

export const isStackingAllowed = (
  card: Card,
  currentCard: Card,
  rules: GameRules
): boolean => {
  if (!rules.stackDrawCards) return false;
  
  if (currentCard.type === 'draw2' && card.type === 'draw2') return true;
  if (currentCard.type === 'wild4' && card.type === 'wild4') return true;
  
  return false;
};

export const handleTimeLimit = (
  game: GameState,
  rules: GameRules
): GameState | null => {
  if (rules.timeLimit === 0) return null;

  const currentPlayer = game.players.find(p => p.isCurrentTurn);
  if (!currentPlayer) return null;

  // Si el jugador no juega en el tiempo límite, roba una carta y pierde el turno
  const updatedGame = drawCard(game, currentPlayer.id);
  const nextPlayerIndex = game.players.findIndex(p => p.id === currentPlayer.id) + 1;
  
  updatedGame.players[nextPlayerIndex % updatedGame.players.length].isCurrentTurn = true;
  currentPlayer.isCurrentTurn = false;

  return updatedGame;
}; 