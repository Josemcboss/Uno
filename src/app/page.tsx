'use client';

import { useEffect, useState } from 'react';
import { Card as CardType, GameState, CardColor, Player, Room } from '../types/game';
import PlayerHand from '../components/PlayerHand';
import ColorSelector from '../components/ColorSelector';
import Chat from '../components/Chat';
import GameControls from '../components/GameControls';
import { motion, AnimatePresence } from 'framer-motion';
import { GameClient } from '../lib/socketConfig';
import React from 'react';
import GameTable from '../components/GameTable';
import AIPlayerButton from '../components/AIPlayerButton';
import SoundEffects from '../services/SoundEffects';
import Achievements, { Achievement } from '../services/Achievements';
import AchievementNotification from '../components/AchievementNotification';

let gameClient: GameClient | null = null;

export default function Home() {
  const [gameId, setGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableGames, setAvailableGames] = useState<Room[]>([]);
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [createRoomName, setCreateRoomName] = useState('');
  const [isRoomPrivate, setIsRoomPrivate] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [winningStreak, setWinningStreak] = useState<number>(0);

  // Nuevo estado para mostrar errores en móviles
  const [showErrorModal, setShowErrorModal] = useState(false);

  const currentPlayer = React.useMemo(() => 
    gameState?.players.find((p: Player) => p.id === playerId),
    [gameState?.players, playerId]
  );

  useEffect(() => {
    const checkConnection = async () => {
      if (!isConnected && !isConnecting) {
        await initializeGame();
      }
      // Cargar el nombre del jugador del localStorage
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
      
      // Intentar reconectar a la última partida
      const lastGameId = localStorage.getItem('lastGameId');
      const lastPlayerId = localStorage.getItem('lastPlayerId');
      if (lastGameId && lastPlayerId && !gameState) {
        setGameId(lastGameId);
        setPlayerId(lastPlayerId);
      }
    };

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isConnecting, gameState]);

  useEffect(() => {
    SoundEffects.initialize();
    Achievements.initialize();
  }, []);

  useEffect(() => {
    if (gameState?.status !== 'waiting' && currentPlayer) {
      console.log('Estado del juego:', {
        gameState: gameState ? {
          id: gameState.id,
          status: gameState.status,
          currentPlayerIndex: gameState.currentPlayerIndex,
          playersCount: gameState.players.length
        } : null,
        currentPlayer: {
          id: currentPlayer.id,
          name: currentPlayer.name,
          cardsCount: currentPlayer.cards.length
        },
        playerId
      });
    }
  }, [gameState, currentPlayer, playerId]);

  const initializeGame = async () => {
    if (!gameClient) {
      setIsConnecting(true);
      gameClient = new GameClient({
        onConnect: () => {
          console.log('Conectado al servidor');
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsConnecting(false);
          setError('Se perdió la conexión con el servidor. Por favor, intenta reconectar.');
        },
        onGameCreated: (game: GameState) => {
          console.log('Juego creado:', game.id);
          setGameState(game);
          setGameId(game.id);
          localStorage.setItem('lastGameId', game.id);
          localStorage.setItem('lastPlayerId', game.players[0].id);
          setPlayerId(game.players[0].id);
        },
        onGameUpdated: onGameUpdated,
        onRoomsUpdated: (rooms: Room[]) => {
          setAvailableGames(rooms);
        }
      });

      try {
        const success = await gameClient.connect();
        if (!success) {
          setError('No se pudo establecer conexión con el servidor');
          setIsConnecting(false);
        }
      } catch (error) {
        console.error('Error al conectar:', error);
        setError('Error al conectar con el servidor');
        setIsConnecting(false);
      }
    }
  };

  const onGameUpdated = (updatedGame: GameState) => {
    console.log('Actualizando estado del juego:', {
      prevStatus: gameState?.status,
      newStatus: updatedGame.status,
      players: updatedGame.players.length
    });
    
    setGameState(updatedGame);
  };

  const reconnect = async () => {
    setError('Intentando reconectar...');
    setIsConnecting(true);
    
    try {
      if (gameClient) {
        const success = await gameClient.connect();
        if (!success) {
          setError('No se pudo establecer conexión con el servidor. Por favor, intenta de nuevo más tarde.');
        }
      } else {
        await initializeGame();
      }
    } catch (err) {
      console.error('Error al reconectar:', err);
      setError('Error al conectar con el servidor. Por favor, intenta más tarde.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const reconnectToGame = async () => {
    if (!gameClient || !gameId || !playerId) return;
    
    try {
      const success = await gameClient.reconnect(gameId, playerId);
      if (!success) {
        setError('No se pudo reconectar a la partida. Puede que ya no exista.');
        // Limpiar datos de la última partida
        localStorage.removeItem('lastGameId');
        localStorage.removeItem('lastPlayerId');
      }
    } catch (error) {
      console.error('Error al reconectar a la partida:', error);
      setError('Error al reconectar a la partida.');
    }
  };

  const createGame = async () => {
    if (!playerName || !gameClient) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!isConnected) {
      setError('No hay conexión con el servidor. Intentando reconectar...');
      await reconnect();
      return;
    }

    setError(null);
    try {
      localStorage.setItem('playerName', playerName);
      
      // Si hay un nombre de sala, crear primero la sala
      let roomId: string | undefined = undefined;
      if (createRoomName.trim()) {
        const createdRoomId = await gameClient.createRoom(createRoomName, isRoomPrivate);
        if (createdRoomId) {
          roomId = createdRoomId;
        }
      }
      
      const success = await gameClient.createGame(playerName, roomId);
      if (!success) {
        setError('Error al crear el juego. El servidor no respondió correctamente.');
      }
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Error al crear el juego. Por favor, intenta de nuevo.');
    }
  };

  const joinGame = async () => {
    if (!gameId || !playerName || !gameClient) return;
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('lastGameId', gameId);
    await gameClient.joinGame(gameId, playerName);
  };
  
  const startGame = async () => {
    if (!gameState || !gameClient) {
      console.log('No se puede iniciar el juego: faltan datos necesarios', { gameState, gameClient });
      return;
    }

    try {
      console.log('Iniciando juego...', { gameId: gameState.id });
      const success = await gameClient.startGame(gameState.id);
      
      if (!success) {
        console.error('Error al iniciar el juego');
        setError('No se pudo iniciar el juego. Por favor, intenta de nuevo.');
      } else {
        console.log('Juego iniciado exitosamente');
        SoundEffects.play('gameStart');
      }
    } catch (err) {
      console.error('Error al iniciar el juego:', err);
      setError('Ocurrió un error al iniciar el juego.');
    }
  };

  const handleAddAI = async () => {
    if (!gameState || !gameClient) {
      console.error('No se puede añadir IA: falta gameState o gameClient');
      return false;
    }
    
    try {
      console.log('Intentando añadir IA a la partida:', gameState.id);
      const aiName = `IA-${Math.floor(Math.random() * 1000)}`;
      
      const success = await gameClient.addAIPlayer(gameState.id, aiName);
      
      if (success) {
        console.log('IA añadida exitosamente:', aiName);
        SoundEffects.play('gameStart');
        return true;
      } else {
        console.error('Error al añadir IA: respuesta del servidor no exitosa');
        setError('No se pudo añadir el jugador IA');
        return false;
      }
    } catch (err) {
      console.error('Error al añadir IA:', err);
      setError('Error al añadir el jugador IA');
      return false;
    }
  };

  const playCard = async (card: CardType) => {
    if (!gameState || !playerId || !gameClient) return;

    const isWildCard = (card: CardType) => {
      return card.type === 'wild' || card.type === 'wildDraw4';
    };

    if (isWildCard(card)) {
      setSelectedCard(card);
      setShowColorSelector(true);
      return;
    }

    await gameClient.playCard(gameState.id, playerId, card);
    SoundEffects.play('cardPlay');

    // Verificar logros relacionados con cartas
    if (isWildCard(card)) {
      const achievement = Achievements.updateProgress('wild_cards', 1);
      if (achievement) setUnlockedAchievement(achievement);
    }
  };

  const handleColorSelect = async (color: CardColor) => {
    if (!selectedCard || !gameState || !gameClient) return;

    await gameClient.playCard(gameState.id, playerId, selectedCard, color);
    SoundEffects.play('cardPlay');
    setShowColorSelector(false);
    setSelectedCard(null);
  };

  const drawCard = async () => {
    if (!gameState || !playerId || !gameClient) return;
    await gameClient.drawCard(gameState.id, playerId);
    SoundEffects.play('cardDraw');
  };
  
  const fetchAvailableGames = async () => {
    try {
      setIsConnecting(true);
      if (!gameClient) {
        gameClient = new GameClient({
          onConnect: () => setIsConnecting(false),
          onDisconnect: () => handleError('Desconectado del servidor'),
          onGameCreated: (game) => setGameState(game),
          onGameUpdated: (game) => setGameState(game),
          onRoomsUpdated: (rooms) => setAvailableGames(rooms),
          onChatMessage: () => {}
        });
      }
      await gameClient.connect();
      const success = await gameClient.listAvailableGames();
      if (success) {
        setShowJoinOptions(true);
      } else {
        handleError('Error al obtener la lista de juegos');
      }
    } catch (err) {
      handleError('Error de conexión: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleSelectGame = (selectedGameId: string) => {
    setGameId(selectedGameId);
    setShowJoinOptions(false);
  };

  useEffect(() => {
    if (gameState?.status === 'finished') {
      const isWinner = gameState.winner === playerId;
      const hasAIPlayer = gameState.players.some(p => p.name.startsWith('IA-'));
      
      if (isWinner) {
        SoundEffects.play('victory');
        setWinningStreak(prev => prev + 1);
      } else {
        setWinningStreak(0);
      }

      const achievements = Achievements.checkGameEndAchievements(
        isWinner,
        hasAIPlayer,
        winningStreak + 1
      );

      if (achievements.length > 0) {
        setUnlockedAchievement(achievements[0]);
      }
    }
  }, [gameState?.status, gameState?.winner, playerId, winningStreak]);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setShowErrorModal(true);
    // Auto-ocultar el error después de 5 segundos
    setTimeout(() => {
      setShowErrorModal(false);
      setError(null);
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-8">
      <AnimatePresence>
        {/* Error Modal para móviles */}
        {showErrorModal && error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">{error}</div>
              <button 
                onClick={() => setShowErrorModal(false)}
                className="ml-4 text-white opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {!gameState ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold mb-6 text-center">UNO Online</h1>
            
            {/* Opciones de reconexión */}
            {gameId && playerId && !gameState && (
              <div className="mb-6 p-4 bg-blue-100 rounded-lg">
                <p className="mb-2">Tienes una partida en curso</p>
                <button
                  onClick={reconnectToGame}
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Reconectar a la partida
                </button>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Tu nombre"
              className="w-full p-2 mb-4 border rounded text-black"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            
            {/* Opciones para crear juego */}
            <div className="space-y-2 mb-6">
              <h3 className="font-semibold">Crear juego</h3>
              <input
                type="text"
                placeholder="Nombre de la sala (opcional)"
                className="w-full p-2 mb-2 border rounded text-black"
                value={createRoomName}
                onChange={(e) => setCreateRoomName(e.target.value)}
              />
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="privateRoom"
                  className="mr-2"
                  checked={isRoomPrivate}
                  onChange={(e) => setIsRoomPrivate(e.target.checked)}
                />
                <label htmlFor="privateRoom">Sala privada</label>
              </div>
              <button
                onClick={createGame}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                disabled={!playerName || isConnecting}
              >
                {isConnecting ? 'Conectando...' : 'Crear Juego'}
              </button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Unirse a juego</h3>
              
              {!showJoinOptions ? (
                <button
                  onClick={fetchAvailableGames}
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors mb-2"
                  disabled={isConnecting}
                >
                  Ver juegos disponibles
                </button>
              ) : (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Partidas disponibles:</h4>
                  {availableGames.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay partidas disponibles</p>
                  ) : (
                    <ul className="max-h-40 overflow-y-auto mb-2 border rounded divide-y text-black">
                      {availableGames.map(game => (
                        <li 
                          key={game.id}
                          onClick={() => handleSelectGame(game.id)}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                        >
                          {game.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => setShowJoinOptions(false)}
                    className="w-full text-sm text-gray-600 p-1"
                  >
                    Cerrar lista
                  </button>
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="ID del juego"
                  className="flex-1 p-2 border rounded text-black"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                />
                <button
                  onClick={joinGame}
                  className="bg-green-500 text-white px-4 rounded hover:bg-green-600 transition-colors"
                  disabled={!gameId || !playerName || isConnecting}
                >
                  Unirse
                </button>
              </div>
            </div>
              
            {error && (
              <div className="text-red-500 mt-4 text-center">
                <p>{error}</p>
                {!isConnected && (
                  <button 
                    onClick={reconnect}
                    className="mt-2 bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 transition-colors"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Conectando...' : 'Reconectar'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="relative min-h-screen">
            {/* Estado de espera */}
            {gameState.status === 'waiting' && currentPlayer && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-black">
                  <h2 className="text-2xl font-bold mb-4 text-center text-black">Sala de espera</h2>
                  <p className="mb-4 text-black">Jugadores conectados: {gameState.players.length}</p>
                  
                  <ul className="mb-6 space-y-1 text-black">
                    {gameState.players.map(player => (
                      <li key={player.id} className="flex items-center text-black">
                        <span className={player.isHost ? "font-bold text-black" : "text-black"}>
                          {player.name} {player.isHost && "(Anfitrión)"}
                          {player.id === playerId && " (Tú)"}
                          {player.name.startsWith('IA-') && " 🤖"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-black">ID de la sala: <span className="font-mono text-xs bg-gray-100 p-1 rounded text-black">{gameState.id}</span></p>
                    <p className="text-sm text-black">Comparte este código para que otros jugadores se unan.</p>
                  </div>
                  
                  {currentPlayer.isHost && (
                    <div className="space-y-4">
                      {gameState.players.length === 1 && (
                        <AIPlayerButton
                          onAddAI={handleAddAI}
                          disabled={gameState.players.some(p => p.name.startsWith('IA-'))}
                        />
                      )}
                      
                      <button
                        onClick={startGame}
                        className={`
                          w-full p-2 rounded transition-colors
                          ${gameState.players.length < 2 
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'}
                        `}
                        disabled={gameState.players.length < 2}
                      >
                        {gameState.players.length < 2 
                          ? "Esperando más jugadores..." 
                          : "Iniciar partida"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Juego en progreso */}
            {gameState?.status !== 'waiting' && currentPlayer && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white mb-4"
                >
                  <h2 className="text-2xl font-bold">Juego #{gameState.id}</h2>
                  {/* Indicador de estado para depuración */}
                  <p className="text-sm opacity-50">
                    Estado: {gameState.status} | 
                    Jugador actual: {gameState.currentPlayerIndex + 1} de {gameState.players.length}
                  </p>
                </motion.div>

                <GameTable
                  gameState={gameState}
                  currentPlayer={currentPlayer}
                  onDrawCard={drawCard}
                  isCurrentPlayerTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId)}
                />

                <PlayerHand
                  cards={currentPlayer.cards}
                  onCardClick={playCard}
                  isCurrentTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId)}
                />

                <Chat
                  playerName={playerName}
                  socket={gameClient}
                />

                <GameControls
                  game={gameState}
                  playerId={playerId}
                  socket={gameClient}
                />

                {showColorSelector && (
                  <ColorSelector onColorSelect={handleColorSelect} />
                )}
              </>
            )}
            
            {/* Pantalla de carga o error */}
            {gameState && !currentPlayer && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-4 text-center text-black">Cargando partida...</h2>
                  <p className="text-gray-600 text-center">
                    Si esto tarda demasiado, puede que hayas perdido la conexión.
                    Intenta recargar la página.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Recargar página
                  </button>
                </div>
              </div>
            )}
            
            {unlockedAchievement && (
              <AchievementNotification
                achievement={unlockedAchievement}
                onClose={() => setUnlockedAchievement(null)}
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
