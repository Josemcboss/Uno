export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wildDraw4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isHost: boolean;
  calledUno: boolean;
  score: number;
  isConnected: boolean;
  lastActive: number;
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  createdAt: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  direction: 1 | -1;
  lastCard: Card | null;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  roomId?: string;
  roundNumber: number;
  lastAction: {
    type: 'play' | 'draw' | 'uno' | 'penalize' | 'join' | 'leave';
    playerId: string;
    timestamp: number;
    card?: Card;
  } | null;
} 