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
        body: JSON.stringify({ 
          action: 'create_game',
          playerId: crypto.randomUUID(),
          playerName 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        return false;
      }

      const data = await response.json();
      if (data.game) {
        this.events.onGameCreated?.(data.game);
        return true;
      }
      return false;
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
        body: JSON.stringify({ 
          action: 'join_game', 
          gameId, 
          playerId: crypto.randomUUID(),
          playerName 
        })
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
        body: JSON.stringify({ 
          action: 'play_card', 
          gameId, 
          playerId, 
          cardId: card.id,
          newColor: selectedColor 
        })
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
        body: JSON.stringify({ 
          action: 'draw_card', 
          gameId, 
          playerId 
        })
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