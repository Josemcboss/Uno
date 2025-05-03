import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const getGame = async (gameId: string) => {
  const game = await redis.get(`game:${gameId}`);
  return game ? JSON.parse(JSON.stringify(game)) : null;
};

export const setGame = async (gameId: string, game: any) => {
  await redis.set(`game:${gameId}`, game);
  // Establecer un tiempo de expiración de 24 horas
  await redis.expire(`game:${gameId}`, 24 * 60 * 60);
};

export const deleteGame = async (gameId: string) => {
  await redis.del(`game:${gameId}`);
};

export default redis; 