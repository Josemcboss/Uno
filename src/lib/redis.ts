import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined');
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined');
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  enableTelemetry: false,
});

export const getGame = async (gameId: string) => {
  try {
    const game = await redis.get(`game:${gameId}`);
    return game ? JSON.parse(JSON.stringify(game)) : null;
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

export const getAllGames = async () => {
  try {
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
  } catch (error) {
    console.error('Error listing games:', error);
    return [];
  }
};

export const setGame = async (gameId: string, game: any) => {
  try {
    await redis.set(`game:${gameId}`, game);
    // Establecer un tiempo de expiración de 24 horas
    await redis.expire(`game:${gameId}`, 24 * 60 * 60);
  } catch (error) {
    console.error('Error setting game:', error);
    throw error;
  }
};

export const deleteGame = async (gameId: string) => {
  try {
    await redis.del(`game:${gameId}`);
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};

export default redis; 