import { NextResponse } from 'next/server';
import type { GameState } from '../../../types/game';
import { createGame, dealInitialCards, drawCard, playCard } from '../../../lib/game';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const games = new Map<string, GameState>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');

  if (gameId && games.has(gameId)) {
    return new NextResponse(
      JSON.stringify({ game: games.get(gameId) }),
      { status: 200 }
    );
  }

  return new NextResponse(
    JSON.stringify({ message: 'Game not found' }),
    { status: 404 }
  );
}

export async function POST(req: Request) {
  const data = await req.json();
  const { action, gameId, playerId, playerName, cardId, newColor } = data;

  switch (action) {
    case 'create_game':
      if (!playerId || !playerName) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing player information' }),
          { status: 400 }
        );
      }
      const newGame = createGame(playerId, playerName);
      games.set(newGame.id, newGame);
      return new NextResponse(
        JSON.stringify({ game: newGame }),
        { status: 200 }
      );

    case 'join_game':
      if (!gameId || !playerId || !playerName) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing required information' }),
          { status: 400 }
        );
      }
      const gameToJoin = games.get(gameId);
      if (!gameToJoin) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      if (gameToJoin.status !== 'waiting') {
        return new NextResponse(
          JSON.stringify({ error: 'Game already started' }),
          { status: 400 }
        );
      }
      gameToJoin.players.push({
        id: playerId,
        name: playerName,
        cards: [],
        isHost: false
      });
      return new NextResponse(
        JSON.stringify({ game: gameToJoin }),
        { status: 200 }
      );

    case 'start_game':
      if (!gameId) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing game ID' }),
          { status: 400 }
        );
      }
      const gameToStart = games.get(gameId);
      if (!gameToStart) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      if (gameToStart.players.length < 2) {
        return new NextResponse(
          JSON.stringify({ error: 'Not enough players' }),
          { status: 400 }
        );
      }
      const startedGame = dealInitialCards(gameToStart);
      startedGame.status = 'playing';
      games.set(gameId, startedGame);
      return new NextResponse(
        JSON.stringify({ game: startedGame }),
        { status: 200 }
      );

    case 'play_card':
      if (!gameId || !playerId || !cardId) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing required information' }),
          { status: 400 }
        );
      }
      const gameToPlay = games.get(gameId);
      if (!gameToPlay) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      const updatedGame = playCard(gameToPlay, playerId, cardId, newColor);
      games.set(gameId, updatedGame);
      return new NextResponse(
        JSON.stringify({ game: updatedGame }),
        { status: 200 }
      );

    case 'draw_card':
      if (!gameId || !playerId) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing required information' }),
          { status: 400 }
        );
      }
      const gameToDraw = games.get(gameId);
      if (!gameToDraw) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      const gameAfterDraw = drawCard(gameToDraw, playerId);
      games.set(gameId, gameAfterDraw);
      return new NextResponse(
        JSON.stringify({ game: gameAfterDraw }),
        { status: 200 }
      );

    default:
      return new NextResponse(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400 }
      );
  }
} 