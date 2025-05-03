import { Redis } from '@upstash/redis';

// Verificamos si las variables de entorno están disponibles
const isEnvAvailable =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string';

// Almacenamiento en memoria como fallback (modo desarrollo)
const memoryStore = new Map();

// Redis client (singleton)
let redis: Redis | null = null;
const getRedis = (): Redis | null => {
  if (!redis && isEnvAvailable) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      enableTelemetry: false,
    });
  }
  return redis;
};

// Obtener juego
export const getGame = async (gameId: string) => {
  const client = getRedis();
  try {
    if (client) {
      const game = await client.get(`game:${gameId}`);
      return game ? JSON.parse(JSON.stringify(game)) : null;
    } else {
      return memoryStore.get(`game:${gameId}`) || null;
    }
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

// Obtener todos los juegos
export const getAllGames = async () => {
  const client = getRedis();
  try {
    if (client) {
      const keys = await client.keys('game:*');
      const games = [];
      for (const key of keys) {
        const game = await client.get(key);
        if (game) {
          games.push({
            id: key.replace('game:', ''),
            ...JSON.parse(JSON.stringify(game)),
          });
        }
      }
      return games;
    } else {
      const games = [];
      for (const [key, value] of memoryStore.entries()) {
        if (key.startsWith('game:')) {
          games.push({
            id: key.replace('game:', ''),
            ...value,
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

// Guardar juego
export const setGame = async (gameId: string, game: any) => {
  const client = getRedis();
  try {
    if (client) {
      await client.set(`game:${gameId}`, game);
      await client.expire(`game:${gameId}`, 24 * 60 * 60); // 24h
    } else {
      memoryStore.set(`game:${gameId}`, game);
    }
  } catch (error) {
    console.error('Error setting game:', error);
    throw error;
  }
};

// Eliminar juego
export const deleteGame = async (gameId: string) => {
  const client = getRedis();
  try {
    if (client) {
      await client.del(`game:${gameId}`);
    } else {
      memoryStore.delete(`game:${gameId}`);
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};
