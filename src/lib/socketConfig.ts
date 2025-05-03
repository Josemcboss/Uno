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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private isConnected: boolean = false;
  private currentGameId: string | null = null;

  constructor(events: GameEvents) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.baseUrl = `${origin}/api`;
    this.events = events;
  }

  async connect() {
    if (this.isConnected) return true;

    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Conexión establecida con el servidor');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.events.onConnect?.();
        this.startPolling();
        return true;
      } else {
        console.error('Error conectando al servidor:', response.status);
        await this.handleDisconnect();
        return false;
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      await this.handleDisconnect();
      return false;
    }
  }

  private async handleDisconnect() {
    this.isConnected = false;
    this.isPolling = false;
    this.events.onDisconnect?.();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intento de reconexión ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      return this.connect();
    } else {
      console.error('Se alcanzó el máximo número de intentos de reconexión');
      return false;
    }
  }

  private startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.poll();
  }

  private async poll() {
    while (this.isPolling && this.isConnected) {
      try {
        const response = await fetch(`${this.baseUrl}/socket?gameId=${this.currentGameId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.game) {
            this.events.onGameUpdated?.(data.game);
          }
        } else {
          throw new Error('Error en la respuesta del polling');
        }
      } catch (error) {
        console.error('Error polling:', error);
        await this.handleDisconnect();
      }
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  async createGame(playerName: string) {
    try {
      const playerId = crypto.randomUUID();
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_game',
          playerId,
          playerName 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor:', data);
        return false;
      }

      if (data.game) {
        this.currentGameId = data.game.id;
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
      const playerId = crypto.randomUUID();
      this.currentGameId = gameId;
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'join_game', 
          gameId, 
          playerId,
          playerName 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor:', data);
        return false;
      }

      if (data.game) {
        this.events.onGameUpdated?.(data.game);
        return true;
      }
      return false;
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

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor:', data);
        return false;
      }

      if (data.game) {
        this.events.onGameUpdated?.(data.game);
        return true;
      }
      return false;
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

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor:', data);
        return false;
      }

      if (data.game) {
        this.events.onGameUpdated?.(data.game);
        return true;
      }
      return false;
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