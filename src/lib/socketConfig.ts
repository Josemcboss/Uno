import type { GameState, Card, CardColor } from '../types/game';
import type { Message } from '../types/chat';
import type { Room } from '../types/game';

export interface GameEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGameCreated?: (game: GameState) => void;
  onGameUpdated?: (game: GameState) => void;
  onRoomsUpdated?: (rooms: Room[]) => void;
  onChatMessage?: (message: Message) => void;
}

export class GameClient {
  private baseUrl: string;
  private events: GameEvents;
  private pollInterval: number = 1000;
  private isPolling: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 2000;
  private isConnected: boolean = false;
  private currentGameId: string | null = null;

  constructor(events: GameEvents) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.baseUrl = `${origin}/api`;
    this.events = events;
  }

  private async handleApiError(error: any): Promise<string> {
    if (error instanceof Error) {
      return error.message;
    }
    if (error.response) {
      try {
        const data = await error.response.json();
        return data.message || 'Error del servidor';
      } catch {
        return `Error ${error.response.status}: ${error.response.statusText}`;
      }
    }
    return 'Error desconocido';
  }

  async connect() {
    if (this.isConnected) return true;

    try {
      console.log('Intentando conectar al servidor...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('Conexión establecida con el servidor');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.events.onConnect?.();
        this.startPolling();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
        console.error('Error conectando al servidor:', errorData.message);
        await this.handleDisconnect();
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Timeout al conectar con el servidor');
        this.events.onDisconnect?.();
        return false;
      }
      const errorMessage = await this.handleApiError(error);
      console.error('Error de conexión:', errorMessage);
      await this.handleDisconnect();
      return false;
    }
  }

  private async handleDisconnect() {
    this.isPolling = false;
    this.currentGameId = null;
    this.isConnected = false;
    this.events.onDisconnect?.();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intento de reconexión ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      return this.connect();
    }
    return false;
  }

  private startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.poll();
  }

  private async poll() {
    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> => {
      return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ) as Promise<Response>
      ]);
    };

    while (this.isPolling && this.isConnected) {
      try {
        if (this.currentGameId) {
          const response = await fetchWithTimeout(`${this.baseUrl}/socket?gameId=${this.currentGameId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.game) {
              this.events.onGameUpdated?.(data.game);
            }
          } else {
            throw new Error(`Error en la respuesta del polling: ${response.status}`);
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
        await this.handleDisconnect();
      }
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  // Obtener salas disponibles
  async listAvailableGames(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket?listGames=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error al obtener salas:', data);
        return false;
      }

      if (data.games) {
        this.events.onRoomsUpdated?.(data.games);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error listing games:', error);
      return false;
    }
  }
  
  // Crear una sala
  async createRoom(roomName: string, isPrivate: boolean = false, maxPlayers: number = 8): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_room',
          roomName,
          isPrivate,
          maxPlayers
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error al crear sala:', data);
        return null;
      }

      if (data.room && data.room.id) {
        return data.room.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }

  async createGame(playerName: string, roomId?: string): Promise<boolean> {
    try {
      const playerId = crypto.randomUUID();
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_game',
          playerId,
          playerName,
          roomId
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

  async joinGame(gameId: string, playerName: string): Promise<boolean> {
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
  
  async startGame(gameId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_game', 
          gameId
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
      console.error('Error starting game:', error);
      return false;
    }
  }

  async playCard(gameId: string, playerId: string, card: Card, selectedColor?: CardColor): Promise<boolean> {
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

  async drawCard(gameId: string, playerId: string): Promise<boolean> {
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
  
  async callUno(gameId: string, playerId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'call_uno', 
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
      console.error('Error calling UNO:', error);
      return false;
    }
  }
  
  async penalizePlayer(gameId: string, playerId: string, reportedById: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'penalize_player', 
          gameId, 
          playerId,
          reportedById
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
      console.error('Error penalizing player:', error);
      return false;
    }
  }
  
  async startNewRound(gameId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_new_round', 
          gameId
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
      console.error('Error starting new round:', error);
      return false;
    }
  }
  
  async leaveGame(gameId: string, playerId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'leave_game', 
          gameId,
          playerId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor:', data);
        return false;
      }

      this.currentGameId = null;
      return true;
    } catch (error) {
      console.error('Error leaving game:', error);
      return false;
    }
  }
  
  async reconnect(gameId: string, playerId: string): Promise<boolean> {
    try {
      this.currentGameId = gameId;
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reconnect', 
          gameId,
          playerId
        })
      });

      const data = await response.json();
      
      if (!response.ok) return false;

      if (data.game) {
        this.events.onGameUpdated?.(data.game);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async sendChatMessage(message: Message): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'chat_message',
          message
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error enviando mensaje:', data);
        return false;
      }
      
      if (data.message) {
        this.events.onChatMessage?.(message);
      }
      return true;
    } catch (error) {
      console.error('Error en chat:', error);
      return false;
    }
  }

  set onChatMessage(callback: (message: Message) => void) {
    this.events.onChatMessage = callback;
  }

  async addAIPlayer(gameId: string, aiName: string): Promise<boolean> {
    try {
      console.log('Enviando solicitud para añadir IA:', { gameId, aiName });
      const response = await fetch(`${this.baseUrl}/socket`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({ 
          action: 'add_ai_player',
          gameId,
          aiName
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error del servidor al añadir IA:', data);
        return false;
      }

      if (data.game) {
        console.log('IA añadida exitosamente, actualizando estado del juego');
        this.events.onGameUpdated?.(data.game);
        return true;
      }
      
      console.error('Respuesta del servidor no contiene datos del juego');
      return false;
    } catch (error) {
      console.error('Error al añadir jugador IA:', error);
      return false;
    }
  }
} 