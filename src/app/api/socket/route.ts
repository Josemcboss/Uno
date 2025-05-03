import { NextResponse } from 'next/server';
import { 
  createGame, 
  dealInitialCards, 
  drawCard, 
  playCard, 
  callUno, 
  penalizePlayer, 
  startNewRound,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  createRoom
} from '../../../lib/game';
import { getGame, setGame, deleteGame, getAllGames } from '../../../lib/redis';
import { Player } from '../../../types/game';

export const runtime = 'edge';
export const preferredRegion = 'cdg1';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const listGames = searchParams.get('listGames');

    // Listar juegos disponibles (para unirse)
    if (listGames === 'true') {
      const games = await getAllGames();
      // Filtrar solo juegos en estado "waiting"
      const availableGames = games
        .filter(game => game.status === 'waiting')
        .map(game => ({
          id: game.id,
          name: `Partida de ${game.players[0]?.name || 'Anónimo'}`,
          players: game.players.length,
          roomId: game.roomId
        }));
      
      return new NextResponse(
        JSON.stringify({ games: availableGames }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    // Si no hay gameId, solo confirmar conexión
    if (!gameId) {
      return new NextResponse(
        JSON.stringify({ message: 'Conexión establecida' }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Obtener estado del juego
    const game = await getGame(gameId);
    if (game) {
      return new NextResponse(
        JSON.stringify({ game }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Game not found' }),
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error in GET handler:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { action, gameId, playerId, playerName, cardId, newColor, roomId, roomName, isPrivate, maxPlayers, reportedById, message } = data;

    switch (action) {
      // --- Gestión de salas ---
      case 'create_room':
        if (!roomName) {
          return new NextResponse(
            JSON.stringify({ error: 'Falta nombre de la sala' }),
            { status: 400 }
          );
        }
        const newRoom = createRoom(roomName, isPrivate, maxPlayers);
        return new NextResponse(
          JSON.stringify({ room: newRoom }),
          { status: 200 }
        );

      // --- Gestión de juegos ---
      case 'create_game':
        if (!playerId || !playerName) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing player information' }),
            { status: 400 }
          );
        }
        const newGame = createGame(playerId, playerName, roomId);
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
        
        // Comprobar si el jugador ya está en la partida
        const existingPlayer = gameToJoin.players.find((p: Player) => p.id === playerId);
        if (existingPlayer) {
          // Si el jugador ya estaba pero se había desconectado, reconectarlo
          if (!existingPlayer.isConnected) {
            const reconnectedGame = reconnectPlayer(gameToJoin, playerId);
            await setGame(gameId, reconnectedGame);
            return new NextResponse(
              JSON.stringify({ game: reconnectedGame }),
              { status: 200 }
            );
          }
          
          return new NextResponse(
            JSON.stringify({ game: gameToJoin }),
            { status: 200 }
          );
        }
        
        // Añadir nuevo jugador
        const updatedGame = addPlayer(gameToJoin, playerId, playerName);
        await setGame(gameId, updatedGame);
        return new NextResponse(
          JSON.stringify({ game: updatedGame }),
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
        await setGame(gameId, startedGame);
        return new NextResponse(
          JSON.stringify({ game: startedGame }),
          { status: 200 }
        );

      // --- Acciones del juego ---
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
        const gameAfterPlay = playCard(gameToPlay, playerId, cardId, newColor);
        await setGame(gameId, gameAfterPlay);
        return new NextResponse(
          JSON.stringify({ game: gameAfterPlay }),
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
        
      case 'call_uno':
        if (!gameId || !playerId) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing required information' }),
            { status: 400 }
          );
        }
        const gameToCallUno = await getGame(gameId);
        if (!gameToCallUno) {
          return new NextResponse(
            JSON.stringify({ error: 'Game not found' }),
            { status: 404 }
          );
        }
        const gameAfterUno = callUno(gameToCallUno, playerId);
        await setGame(gameId, gameAfterUno);
        return new NextResponse(
          JSON.stringify({ game: gameAfterUno }),
          { status: 200 }
        );
        
      case 'penalize_player':
        if (!gameId || !playerId || !reportedById) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing required information' }),
            { status: 400 }
          );
        }
        const gameToPenalize = await getGame(gameId);
        if (!gameToPenalize) {
          return new NextResponse(
            JSON.stringify({ error: 'Game not found' }),
            { status: 404 }
          );
        }
        const gameAfterPenalty = penalizePlayer(gameToPenalize, playerId, reportedById);
        await setGame(gameId, gameAfterPenalty);
        return new NextResponse(
          JSON.stringify({ game: gameAfterPenalty }),
          { status: 200 }
        );
        
      case 'start_new_round':
        if (!gameId) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing required information' }),
            { status: 400 }
          );
        }
        const gameToReset = await getGame(gameId);
        if (!gameToReset) {
          return new NextResponse(
            JSON.stringify({ error: 'Game not found' }),
            { status: 404 }
          );
        }
        if (gameToReset.status !== 'finished') {
          return new NextResponse(
            JSON.stringify({ error: 'Game is not finished yet' }),
            { status: 400 }
          );
        }
        const newRoundGame = startNewRound(gameToReset);
        await setGame(gameId, newRoundGame);
        return new NextResponse(
          JSON.stringify({ game: newRoundGame }),
          { status: 200 }
        );
      
      case 'leave_game':
        if (!gameId || !playerId) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing required information' }),
            { status: 400 }
          );
        }
        const gameToLeave = await getGame(gameId);
        if (!gameToLeave) {
          return new NextResponse(
            JSON.stringify({ error: 'Game not found' }),
            { status: 404 }
          );
        }
        const gameAfterLeave = removePlayer(gameToLeave, playerId);
        
        // Si no quedan jugadores, eliminar el juego
        if (gameAfterLeave.players.length === 0) {
          await deleteGame(gameId);
          return new NextResponse(
            JSON.stringify({ message: 'Game deleted' }),
            { status: 200 }
          );
        }
        
        await setGame(gameId, gameAfterLeave);
        return new NextResponse(
          JSON.stringify({ game: gameAfterLeave }),
          { status: 200 }
        );
        
      case 'reconnect':
        if (!gameId || !playerId) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing required information' }),
            { status: 400 }
          );
        }
        const gameToReconnect = await getGame(gameId);
        if (!gameToReconnect) {
          return new NextResponse(
            JSON.stringify({ error: 'Game not found' }),
            { status: 404 }
          );
        }
        const gameAfterReconnect = reconnectPlayer(gameToReconnect, playerId);
        await setGame(gameId, gameAfterReconnect);
        return new NextResponse(
          JSON.stringify({ game: gameAfterReconnect }),
          { status: 200 }
        );

      case 'chat_message':
        if (!message) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing message' }),
            { status: 400 }
          );
        }
        // Enviar el mensaje a todos los jugadores
        return new NextResponse(
          JSON.stringify({ message }),
          { status: 200 }
        );

      default:
        return new NextResponse(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 