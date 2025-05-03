'use client';

import { useEffect, useState } from 'react';
import { Card as CardType, GameState, CardColor, Player } from '../types/game';
import Card from '../components/Card';
import PlayerHand from '../components/PlayerHand';
import ColorSelector from '../components/ColorSelector';
import Chat from '../components/Chat';
import { motion, AnimatePresence } from 'framer-motion';
import { GameClient } from '../lib/socketConfig';
import React from 'react';

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

  const currentPlayer = React.useMemo(() => 
    gameState?.players.find((p: Player) => p.id === playerId),
    [gameState?.players, playerId]
  );

  useEffect(() => {
    if (!isConnected) {
      initializeGame();
    }
    // Cargar el nombre del jugador del localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, [isConnected]);

  const initializeGame = async () => {
    if (!gameClient) {
      gameClient = new GameClient({
        onConnect: () => {
          console.log('Conectado al servidor');
          setIsConnected(true);
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
        onGameCreated: (game: GameState) => {
          setGameState(game);
          setGameId(game.id);
          setPlayerId(game.players[0].id);
          localStorage.setItem('lastGameId', game.id);
        },
        onGameUpdated: (game: GameState) => {
          setGameState(game);
        }
      });

      await gameClient.connect();
    }
  };

  const createGame = async () => {
    if (!playerName || !gameClient) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!isConnected) {
      setError('No hay conexión con el servidor. Intentando reconectar...');
      await initializeGame();
      return;
    }

    setError(null);
    try {
      localStorage.setItem('playerName', playerName);
      const success = await gameClient.createGame(playerName);
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
    await gameClient.joinGame(gameId, playerName);
  };

  const playCard = async (card: CardType) => {
    if (!gameState || !playerId || !gameClient) return;

    if (card.type === 'wild' || card.type === 'wildDraw4') {
      setSelectedCard(card);
      setShowColorSelector(true);
      return;
    }

    await gameClient.playCard(gameState.id, playerId, card);
  };

  const handleColorSelect = async (color: CardColor) => {
    if (!selectedCard || !gameState || !gameClient) return;

    await gameClient.playCard(gameState.id, playerId, selectedCard, color);
    setShowColorSelector(false);
    setSelectedCard(null);
  };

  const drawCard = async () => {
    if (!gameState || !playerId || !gameClient) return;
    await gameClient.drawCard(gameState.id, playerId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-8">
      <AnimatePresence>
        {!gameState ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold mb-6 text-center">UNO Online</h1>
            <input
              type="text"
              placeholder="Tu nombre"
              className="w-full p-2 mb-4 border rounded"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                disabled={!playerName}
              >
                Crear Juego
              </button>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="ID del juego"
                  className="flex-1 p-2 border rounded"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                />
                <button
                  onClick={joinGame}
                  className="bg-green-500 text-white px-4 rounded hover:bg-green-600 transition-colors"
                  disabled={!gameId || !playerName}
                >
                  Unirse
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 mt-4 text-center">{error}</p>
            )}
          </motion.div>
        ) : (
          <div className="relative min-h-screen">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white mb-4"
            >
              <h2 className="text-2xl font-bold">Juego #{gameState.id}</h2>
              <div className="mt-2">
                {gameState.players.map((player: Player) => (
                  <motion.div
                    key={player.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`${
                      gameState.currentPlayerIndex === gameState.players.indexOf(player) ? 'text-yellow-300' : ''
                    }`}
                  >
                    {player.name} ({player.cards.length} cartas)
                    {player.id === playerId && ' (Tú)'}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="flex justify-center items-center my-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                {gameState.lastCard && <Card card={gameState.lastCard} />}
              </motion.div>
            </div>

            {currentPlayer && (
              <>
                <PlayerHand
                  cards={currentPlayer.cards}
                  onCardClick={playCard}
                  isCurrentTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId)}
                />
                {gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={drawCard}
                    className="fixed bottom-48 left-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                  >
                    Robar Carta
                  </motion.button>
                )}
              </>
            )}

            <Chat
              gameId={gameState.id}
              playerName={playerName}
              socket={gameClient}
            />

            {showColorSelector && (
              <ColorSelector onColorSelect={handleColorSelect} />
            )}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
