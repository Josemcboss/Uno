export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

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
  isCurrentTurn: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentCard: Card;
  direction: 'clockwise' | 'counterclockwise';
  currentColor: CardColor;
  drawPile: Card[];
  discardPile: Card[];
  status: 'waiting' | 'playing' | 'finished';
  winner?: string;
} 