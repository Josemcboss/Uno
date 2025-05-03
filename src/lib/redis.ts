import { Redis } from '@upstash/redis';

// Para el desarrollo y la demostración, vamos a usar un cliente mock si las variables de entorno no están disponibles
const isEnvAvailable = 
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' && 
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string';

// Creamos un mapa en memoria para almacenar datos si Redis no está disponible
const memoryStore = new Map();

const createRedisClient = () => {
  if (isEnvAvailable) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      enableTelemetry: false,
    });
  }
  
  console.warn('Variables de entorno Redis no disponibles. Usando almacenamiento en memoria.');
  return null;
};

const redis = createRedisClient();

export const getGame = async (gameId: string) => {
  try {
    if (redis) {
      const game = await redis.get(`game:${gameId}`);
      return game ? JSON.parse(JSON.stringify(game)) : null;
    } else {
      // Fallback a almacenamiento en memoria
      return memoryStore.get(`game:${gameId}`) || null;
    }
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

export const getAllGames = async () => {
  try {
    if (redis) {
      const keys = await redis.keys('game:*');
      const games = [];
      for (const key of keys) {
        const game = await redis.get(key);
        if (game) {
          games.push({
            id: key.replace('game:', ''),
            ...JSON.parse(JSON.stringify(game))
          });
        }
      }
      return games;
    } else {
      // Fallback a almacenamiento en memoria
      const games = [];
      for (const [key, value] of memoryStore.entries()) {
        if (key.startsWith('game:')) {
          games.push({
            id: key.replace('game:', ''),
            ...value
          });
        }
      }
      return games;
    }
  } catch (error) {
    console.error('Error listing games:', error);
    return [];
  }
};

export const setGame = async (gameId: string, game: any) => {
  try {
    if (redis) {
      await redis.set(`game:${gameId}`, game);
      // Establecer un tiempo de expiración de 24 horas
      await redis.expire(`game:${gameId}`, 24 * 60 * 60);
    } else {
      // Fallback a almacenamiento en memoria
      memoryStore.set(`game:${gameId}`, game);
    }
  } catch (error) {
    console.error('Error setting game:', error);
    throw error;
  }
};

export const deleteGame = async (gameId: string) => {
  try {
    if (redis) {
      await redis.del(`game:${gameId}`);
    } else {
      // Fallback a almacenamiento en memoria
      memoryStore.delete(`game:${gameId}`);
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};

export default redis; 