import { NextResponse } from 'next/server';
import { createGame, dealInitialCards, drawCard, playCard } from '../../../lib/game';
import { getGame, setGame } from '../../../lib/redis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return new NextResponse(
        JSON.stringify({ message: 'Conexión establecida' }),
        { status: 200 }
      );
    }

    const game = await getGame(gameId);
    if (game) {
      return new NextResponse(
        JSON.stringify({ game }),
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Game not found' }),
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in GET handler:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
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
      await setGame(newGame.id, newGame);
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
      const gameToJoin = await getGame(gameId);
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
      await setGame(gameId, gameToJoin);
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
      const gameToStart = await getGame(gameId);
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
      await setGame(gameId, startedGame);
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
      const gameToPlay = await getGame(gameId);
      if (!gameToPlay) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      const updatedGame = playCard(gameToPlay, playerId, cardId, newColor);
      await setGame(gameId, updatedGame);
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
      const gameToDraw = await getGame(gameId);
      if (!gameToDraw) {
        return new NextResponse(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404 }
        );
      }
      const gameAfterDraw = drawCard(gameToDraw, playerId);
      await setGame(gameId, gameAfterDraw);
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