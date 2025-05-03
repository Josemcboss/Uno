import { v4 as uuidv4 } from 'uuid';
import type { Card, CardColor, CardType, GameState, Player } from '../types/game';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const WINNING_SCORE = 500; // Puntuación necesaria para ganar la partida

// Puntuación según las reglas oficiales de UNO
const CARD_POINTS = {
  number: (value: number) => value,
  skip: 20,
  reverse: 20,
  draw2: 20,
  wild: 50,
  wildDraw4: 50
};

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
  let currentIndex = shuffled.length;
  let randomIndex;

  // Mientras queden elementos para barajar
  while (currentIndex !== 0) {
    // Seleccionar un elemento restante
    randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * currentIndex);
    currentIndex--;

    // E intercambiarlo con el elemento actual
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  // Realizar un segundo pase de barajado para mayor aleatoriedad
  currentIndex = shuffled.length;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

export function createGame(hostId: string, hostName: string, roomId?: string): GameState {
  const deck = createDeck();
  const players: Player[] = [{
    id: hostId,
    name: hostName,
    cards: [],
    isHost: true,
    calledUno: false,
    score: 0,
    isConnected: true,
    lastActive: Date.now()
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
    winner: null,
    gameWinner: null,
    roomId,
    roundNumber: 1,
    lastAction: null
  };
}

export function dealInitialCards(game: GameState): GameState {
  const updatedGame = { ...game };
  
  // Dar 7 cartas a cada jugador
  updatedGame.players.forEach(player => {
    player.cards = updatedGame.deck.splice(0, 7);
    player.calledUno = false; // Reiniciar el estado UNO
  });

  // Buscar una carta que no sea comodín para la primera carta
  let firstCardIndex = 0;
  while (firstCardIndex < updatedGame.deck.length) {
    const card = updatedGame.deck[firstCardIndex];
    if (card.type !== 'wild' && card.type !== 'wildDraw4') {
      break;
    }
    firstCardIndex++;
  }
  
  // Si no se encuentra una carta no comodín, usar la primera carta
  if (firstCardIndex >= updatedGame.deck.length) {
    firstCardIndex = 0;
  }
  
  // Poner la carta seleccionada en el montón de descarte
  const firstCard = updatedGame.deck.splice(firstCardIndex, 1)[0];
  if (firstCard) {
    updatedGame.discardPile = [firstCard];
    updatedGame.lastCard = firstCard;
  }

  // Establecer el estado de juego a 'playing'
  updatedGame.status = 'playing';
  
  // Registrar la acción de inicio de ronda
  updatedGame.lastAction = {
    type: 'play',
    playerId: 'system',
    timestamp: Date.now(),
    card: firstCard
  };

  return updatedGame;
}

export function isValidPlay(card: Card, lastCard: Card): boolean {
  // Comodines siempre son válidos
  if (card.color === 'black') return true;
  
  // Mismo color
  if (card.color === lastCard.color) return true;
  
  // Mismo número
  if (card.type === 'number' && lastCard.type === 'number' && card.value === lastCard.value) return true;
  
  // Mismo tipo de carta especial (skip, reverse, draw2)
  if (card.type === lastCard.type && card.type !== 'number') return true;
  
  return false;
}

export function playCard(game: GameState, playerId: string, cardId: string, newColor?: CardColor): GameState {
  // Crear una copia del juego para no mutar el original
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  // Verificar que sea el turno del jugador
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== updatedGame.currentPlayerIndex) {
    return game;
  }
  
  const player = updatedGame.players[playerIndex];
  const cardIndex = player.cards.findIndex(c => c.id === cardId);
  
  // Verificar que el jugador tenga la carta
  if (cardIndex === -1) {
    return game;
  }

  const card = { ...player.cards[cardIndex] };
  
  // Verificar que la jugada sea válida
  if (!updatedGame.lastCard || !isValidPlay(card, updatedGame.lastCard)) {
    return game;
  }

  // Remover la carta de la mano del jugador
  player.cards.splice(cardIndex, 1);
  
  // Actualizar el lastActive del jugador
  player.lastActive = Date.now();
  
  // Para cartas wild, asignar el nuevo color
  if (card.type === 'wild' || card.type === 'wildDraw4') {
    if (newColor && COLORS.includes(newColor)) {
      card.color = newColor;
    } else {
      // Si no se especifica un color válido, usar rojo por defecto
      card.color = 'red';
    }
  }

  // Aplicar efectos de la carta
  const nextPlayerIndex = getNextPlayerIndex(updatedGame, 1);
  
  switch (card.type) {
    case 'skip':
      // Saltar al siguiente jugador
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
      
    case 'reverse':
      // Cambiar dirección y pasar al siguiente jugador en la nueva dirección
      updatedGame.direction *= -1;
      
      // Si solo hay 2 jugadores, funciona como skip
      if (updatedGame.players.length === 2) {
        updatedGame.currentPlayerIndex = playerIndex;
      } else {
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
      }
      break;
      
    case 'draw2':
      // El siguiente jugador roba 2 cartas y pierde su turno
      const nextPlayer = updatedGame.players[nextPlayerIndex];
      
      // Si el mazo tiene menos de 2 cartas, barajar el descarte
      if (updatedGame.deck.length < 2 && updatedGame.discardPile.length > 1) {
        const topCard = updatedGame.discardPile.pop()!;
        updatedGame.deck = shuffleDeck(updatedGame.discardPile);
        updatedGame.discardPile = [topCard];
      }
      
      // Robar cartas del mazo
      const cardsToDraw = Math.min(2, updatedGame.deck.length);
      nextPlayer.cards.push(...updatedGame.deck.splice(0, cardsToDraw));
      
      // Saltar al siguiente jugador
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
      
    case 'wild':
      // Pasar al siguiente jugador
      updatedGame.currentPlayerIndex = nextPlayerIndex;
      break;
      
    case 'wildDraw4':
      // El siguiente jugador roba 4 cartas y pierde su turno
      const nextPlayerDraw4 = updatedGame.players[nextPlayerIndex];
      
      // Si el mazo tiene menos de 4 cartas, barajar el descarte
      if (updatedGame.deck.length < 4 && updatedGame.discardPile.length > 1) {
        const topCard = updatedGame.discardPile.pop()!;
        updatedGame.deck = shuffleDeck(updatedGame.discardPile);
        updatedGame.discardPile = [topCard];
      }
      
      // Robar cartas del mazo
      const cardsToDrawWild4 = Math.min(4, updatedGame.deck.length);
      nextPlayerDraw4.cards.push(...updatedGame.deck.splice(0, cardsToDrawWild4));
      
      // Saltar al siguiente jugador
      updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 2);
      break;
      
    default:
      // Carta normal, pasar al siguiente jugador
      updatedGame.currentPlayerIndex = nextPlayerIndex;
  }

  // Actualizar el estado del juego
  updatedGame.discardPile.push(card);
  updatedGame.lastCard = card;
  
  // Registrar la acción
  updatedGame.lastAction = {
    type: 'play',
    playerId,
    timestamp: Date.now(),
    card
  };

  // Verificar si el jugador quedó con una carta y no dijo UNO
  if (player.cards.length === 1 && !player.calledUno) {
    // El jugador está en peligro de recibir penalización
    // La penalización real se aplica en callUno o penalizePlayer
    player.calledUno = false;
  }

  // Verificar si el jugador ganó
  if (player.cards.length === 0) {
    updatedGame.status = 'finished';
    updatedGame.winner = playerId;
    
    // Calcular puntuación de la ronda
    calculateScore(updatedGame);
  }

  // Verificar si necesitamos rebarajar
  if (updatedGame.deck.length < 4 && updatedGame.status !== 'finished') {
    if (updatedGame.discardPile.length > 1) {
    const lastCard = updatedGame.discardPile.pop()!;
    updatedGame.deck = shuffleDeck(updatedGame.discardPile);
    updatedGame.discardPile = [lastCard];
    }
  }

  return updatedGame;
}

// Calcular puntuación según las reglas oficiales de UNO
function calculateScore(game: GameState): void {
  if (!game.winner) return;
  
  const winnerIndex = game.players.findIndex(p => p.id === game.winner);
  if (winnerIndex === -1) return;
  
  let totalPoints = 0;
  
  // Sumar puntos de las cartas que quedan en manos de los oponentes
  game.players.forEach((player, index) => {
    if (index !== winnerIndex) {
      player.cards.forEach(card => {
        if (card.type === 'number') {
          totalPoints += CARD_POINTS.number(card.value || 0);
        } else {
          totalPoints += CARD_POINTS[card.type];
        }
      });
    }
  });
  
  // Asignar puntos al ganador
  game.players[winnerIndex].score += totalPoints;
  
  // Verificar si el jugador ganó la partida
  if (game.players[winnerIndex].score >= WINNING_SCORE) {
    game.status = 'game_over';
    game.gameWinner = game.winner;
  }
}

// Llamar "UNO" cuando un jugador queda con una carta
export function callUno(game: GameState, playerId: string): GameState {
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return game;
  
  const player = updatedGame.players[playerIndex];
  player.calledUno = true;
  player.lastActive = Date.now();
  
  // Registrar la acción
  updatedGame.lastAction = {
    type: 'uno',
    playerId,
    timestamp: Date.now()
  };
  
  return updatedGame;
}

// Penalizar a un jugador por no decir UNO
export function penalizePlayer(game: GameState, playerId: string, reportedById: string): GameState {
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return game;
  
  const player = updatedGame.players[playerIndex];
  const reportedBy = updatedGame.players.find(p => p.id === reportedById);
  
  if (!reportedBy) return game;
  
  // Solo se puede penalizar si:
  // 1. El jugador tiene exactamente una carta
  // 2. No ha dicho UNO
  // 3. Han pasado menos de 3 segundos desde su última acción
  if (player.cards.length === 1 && 
      !player.calledUno && 
      updatedGame.lastAction && 
      updatedGame.lastAction.playerId === playerId && 
      Date.now() - updatedGame.lastAction.timestamp < 3000) {
    
    // Si el mazo tiene menos de 2 cartas, barajar el descarte
    if (updatedGame.deck.length < 2 && updatedGame.discardPile.length > 1) {
      const topCard = updatedGame.discardPile.pop()!;
      updatedGame.deck = shuffleDeck(updatedGame.discardPile);
      updatedGame.discardPile = [topCard];
    }
    
    // El jugador roba 2 cartas como penalización
    const cardsToDraw = Math.min(2, updatedGame.deck.length);
    const drawnCards = updatedGame.deck.splice(0, cardsToDraw);
    player.cards.push(...drawnCards);
    
    // Registrar la acción
    updatedGame.lastAction = {
      type: 'penalize',
      playerId: reportedById,
      timestamp: Date.now()
    };
  }

  return updatedGame;
}

function getNextPlayerIndex(game: GameState, steps: number): number {
  const totalPlayers = game.players.length;
  return (game.currentPlayerIndex + (steps * game.direction) + totalPlayers) % totalPlayers;
}

export function drawCard(game: GameState, playerId: string): GameState {
  // Crear una copia del juego para no mutar el original
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  // Verificar que sea el turno del jugador
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== updatedGame.currentPlayerIndex) {
    return game;
  }
  
  const player = updatedGame.players[playerIndex];
  
  // Actualizar el lastActive del jugador
  player.lastActive = Date.now();

  // Verificar si necesitamos rebarajar
  if (updatedGame.deck.length === 0) {
    if (updatedGame.discardPile.length > 1) {
      const lastCard = updatedGame.discardPile.pop()!;
      updatedGame.deck = shuffleDeck(updatedGame.discardPile);
      updatedGame.discardPile = [lastCard];
    } else {
      // No hay cartas para robar
      return game;
    }
  }

  // Robar una carta del mazo
  const drawnCard = updatedGame.deck.pop()!;
  player.cards.push(drawnCard);

  // Registrar la acción
  updatedGame.lastAction = {
    type: 'draw',
    playerId,
    timestamp: Date.now(),
    card: drawnCard
  };

  // Pasar al siguiente jugador
  updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);

  return updatedGame;
}

// Iniciar una nueva ronda después de que termina una
export function startNewRound(game: GameState): GameState {
  // Si el juego no está terminado o ya hay un ganador final, no hacer nada
  if (game.status !== 'finished' || game.gameWinner !== null) return game;
  
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  // Incrementar el número de ronda
  updatedGame.roundNumber += 1;
  
  // Reiniciar el mazo y repartir nuevas cartas
  updatedGame.deck = createDeck();
  updatedGame.discardPile = [];
  updatedGame.lastCard = null;
  updatedGame.winner = null;
  updatedGame.status = 'waiting';
  
  // Mantener la puntuación de los jugadores pero reiniciar sus cartas
  updatedGame.players.forEach(player => {
    player.cards = [];
    player.calledUno = false;
  });
  
  // El ganador de la ronda anterior comienza la nueva ronda
  if (game.winner) {
    const winnerIndex = updatedGame.players.findIndex(p => p.id === game.winner);
    if (winnerIndex !== -1) {
      updatedGame.currentPlayerIndex = winnerIndex;
    }
  }
  
  return dealInitialCards(updatedGame);
}

// Crear una sala
export function createRoom(name: string, isPrivate: boolean, maxPlayers: number = 8) {
  return {
    id: uuidv4(),
    name,
    isPrivate,
    maxPlayers,
    createdAt: Date.now()
  };
}

// Añadir un jugador a un juego existente
export function addPlayer(game: GameState, playerId: string, playerName: string): GameState {
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  // Verificar que el juego esté en espera y que no se exceda el límite de jugadores
  if (updatedGame.status !== 'waiting') return game;
  
  // Verificar que el jugador no esté ya en la partida
  if (updatedGame.players.some(p => p.id === playerId)) return game;
  
  // Añadir el nuevo jugador
  updatedGame.players.push({
    id: playerId,
    name: playerName,
    cards: [],
    isHost: false,
    calledUno: false,
    score: 0,
    isConnected: true,
    lastActive: Date.now()
  });
  
  // Registrar la acción
  updatedGame.lastAction = {
    type: 'join',
    playerId,
    timestamp: Date.now()
  };
  
  return updatedGame;
}

// Eliminar un jugador de un juego
export function removePlayer(game: GameState, playerId: string): GameState {
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return game;
  
  // Si el juego ya está en curso, marcar al jugador como desconectado
  if (updatedGame.status === 'playing') {
    updatedGame.players[playerIndex].isConnected = false;
    
    // Si es el turno de este jugador, pasar al siguiente
    if (playerIndex === updatedGame.currentPlayerIndex) {
    updatedGame.currentPlayerIndex = getNextPlayerIndex(updatedGame, 1);
  }
  } else {
    // Si el juego está en espera, eliminar al jugador completamente
    updatedGame.players.splice(playerIndex, 1);
    
    // Si era el host, asignar un nuevo host
    if (updatedGame.players.length > 0 && !updatedGame.players.some(p => p.isHost)) {
      updatedGame.players[0].isHost = true;
    }
  }
  
  // Registrar la acción
  updatedGame.lastAction = {
    type: 'leave',
    playerId,
    timestamp: Date.now()
  };
  
  return updatedGame;
}

// Reconectar a un jugador
export function reconnectPlayer(game: GameState, playerId: string): GameState {
  const updatedGame = JSON.parse(JSON.stringify(game)) as GameState;
  
  const playerIndex = updatedGame.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return game;
  
  updatedGame.players[playerIndex].isConnected = true;
  updatedGame.players[playerIndex].lastActive = Date.now();

  return updatedGame;
} 