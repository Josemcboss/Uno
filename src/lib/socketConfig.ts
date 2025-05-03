import type { GameState, Card, CardColor } from '../types/game';

export interface GameEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGameCreated?: (game: GameState) => void;
  onGameUpdated?: (game: GameState) => void;
}

export class GameClient {
  private baseUrl: string;
  private events: GameEvents;
  private pollInterval: number = 1000;
  private isPolling: boolean = false;

  constructor(events: GameEvents) {
    this.baseUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api`
      : 'http://localhost:3000/api';
    this.events = events;
  }

  async connect() {
    try {
      const response = await fetch(`${this.baseUrl}/socket`);
      if (response.ok) {
        this.events.onConnect?.();
        this.startPolling();
      }
    } catch (error) {
      console.error('Error connecting:', error);
      this.events.onDisconnect?.();
    }
  }

  private startPolling() {
    this.isPolling = true;
    this.poll();
  }

  private async poll(): Promise<void> {
    while (this.isPolling) {
      try {
        const response = await fetch(`${this.baseUrl}/socket/poll`);
        if (response.ok) {
          const data: {
            type: 'gameCreated' | 'gameUpdated';
            game: GameState;
          } = await response.json();
          
          if (data.type === 'gameCreated') {
            this.events.onGameCreated?.(data.game);
          } else if (data.type === 'gameUpdated') {
            this.events.onGameUpdated?.(data.game);
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  async createGame(playerName: string) {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'createGame', playerName })
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating game:', error);
      return false;
    }
  }

  async joinGame(gameId: string, playerName: string) {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'joinGame', gameId, playerName })
      });
      return response.ok;
    } catch (error) {
      console.error('Error joining game:', error);
      return false;
    }
  }

  async playCard(gameId: string, playerId: string, card: Card, selectedColor?: CardColor) {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'playCard', gameId, playerId, card, selectedColor })
      });
      return response.ok;
    } catch (error) {
      console.error('Error playing card:', error);
      return false;
    }
  }

  async drawCard(gameId: string, playerId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'drawCard', gameId, playerId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error drawing card:', error);
      return false;
    }
  }

  disconnect() {
    this.isPolling = false;
    this.events.onDisconnect?.();
  }
} 