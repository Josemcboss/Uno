import React, { useState } from 'react';
import { GameState } from '../types/game';
import { GameClient } from '../lib/socketConfig';
import { motion } from 'framer-motion';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';

interface GameControlsProps {
  game: GameState;
  playerId: string;
  socket: GameClient | null;
}

const GameControls: React.FC<GameControlsProps> = ({ game, playerId, socket }) => {
  const [showPanel, setShowPanel] = useState(true);
  const currentPlayer = game.players.find(p => p.id === playerId);
  const isMyTurn = game.currentPlayerIndex === game.players.findIndex(p => p.id === playerId);
  const hasOneCard = currentPlayer?.cards.length === 1;
  const hasCalledUno = currentPlayer?.calledUno || false;
  
  // Estados de juego
  const isFinished = game.status === 'finished';
  const isGameOver = game.status === 'game_over';
  const winner = game.winner ? game.players.find(p => p.id === game.winner) : null;
  const gameWinner = game.gameWinner ? game.players.find(p => p.id === game.gameWinner) : null;
  
  const handleCallUno = async () => {
    if (!socket || !hasOneCard || hasCalledUno) return;
    await socket.callUno(game.id, playerId);
  };
  
  const handleReportUno = async (targetPlayerId: string) => {
    if (!socket) return;
    
    // Solo se puede reportar si el jugador tiene una carta y no ha dicho UNO
    const targetPlayer = game.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.cards.length !== 1 || targetPlayer.calledUno) return;
    
    await socket.penalizePlayer(game.id, targetPlayerId, playerId);
  };
  
  const handleStartNewRound = async () => {
    if (!socket || !isFinished) return;
    await socket.startNewRound(game.id);
  };
  
  const handleLeaveGame = async () => {
    if (!socket) return;
    await socket.leaveGame(game.id, playerId);
    // Redirigir a la página de inicio
    window.location.href = '/';
  };
  
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-4">
      {/* Botón para mostrar/ocultar */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPanel(!showPanel)}
        className="self-end bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      >
        {showPanel ? <IoMdEyeOff size={24} /> : <IoMdEye size={24} />}
      </motion.button>

      {/* Panel de información */}
      <motion.div
        initial={false}
        animate={{
          opacity: showPanel ? 1 : 0,
          scale: showPanel ? 1 : 0.8,
          height: showPanel ? 'auto' : 0,
          marginTop: showPanel ? 16 : 0
        }}
        transition={{ duration: 0.2 }}
        className={`overflow-hidden ${!showPanel && 'pointer-events-none'}`}
      >
        {/* Información del juego */}
        <div className="bg-white p-4 rounded-lg shadow-lg text-black">
          <h3 className="font-bold mb-2 text-black">Ronda {game.roundNumber}</h3>
          
          {/* Información de puntuación */}
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-black">Puntuación:</h4>
            <ul className="text-sm">
              {game.players.map(player => (
                <li key={player.id} className={player.id === playerId ? "font-bold" : ""}>
                  {player.name}: {player.score} puntos
                  {player.id === game.gameWinner && " 🏆"}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Turno actual */}
          {!isGameOver && (
            <>
              <p className="text-sm text-black">
                Turno de: <span className="font-bold">{game.players[game.currentPlayerIndex]?.name || "?"}</span>
                {isMyTurn && <span className="ml-2 text-green-600">(Es tu turno)</span>}
              </p>
              
              {/* Dirección */}
              <p className="text-sm text-black">
                Dirección: {game.direction === 1 ? "→" : "←"}
              </p>
            </>
          )}
        </div>
        
        {/* Controles de UNO - solo visible en tu turno */}
        {isMyTurn && hasOneCard && !hasCalledUno && !isGameOver && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCallUno}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-2xl hover:bg-red-700 transition-colors"
          >
            ¡UNO!
          </motion.button>
        )}
        
        {/* Lista de jugadores para reportar UNO */}
        <div className="bg-white p-4 rounded-lg shadow-lg text-black">
          <h3 className="font-bold mb-2 text-black">Jugadores:</h3>
          <ul className="text-sm space-y-1">
            {game.players.map(player => (
              <li key={player.id} className="flex justify-between items-center">
                <span className={`${player.id === playerId ? "font-bold" : ""} ${!player.isConnected ? "text-gray-400" : "text-black"}`}>
                  {player.name} ({player.cards.length})
                  {player.id === playerId && " (Tú)"}
                  {!player.isConnected && " (Desconectado)"}
                </span>
                
                {/* Botón para reportar UNO */}
                {!isGameOver && player.cards.length === 1 && !player.calledUno && player.id !== playerId && (
                  <button
                    onClick={() => handleReportUno(player.id)}
                    className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    ¡Olvidó UNO!
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Controles de fin de ronda/partida */}
        {(isFinished || isGameOver) && (
          <div className="bg-white p-4 rounded-lg shadow-lg text-black">
            {isGameOver ? (
              <>
                <h3 className="font-bold mb-2 text-purple-600">¡Fin de la partida!</h3>
                {gameWinner && (
                  <div className="mb-4">
                    <p className="text-black">
                      ¡<span className="font-bold">{gameWinner.name}</span> ha ganado la partida!
                    </p>
                    <p className="text-sm text-gray-600">
                      Puntuación final: {gameWinner.score} puntos
                    </p>
                  </div>
                )}
                <button
                  onClick={handleLeaveGame}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
                >
                  Volver al menú principal
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold mb-2 text-green-600">¡Ronda finalizada!</h3>
                {winner && (
                  <p className="mb-4 text-black">
                    Ganador: <span className="font-bold">{winner.name}</span> (+{winner.score} puntos)
                  </p>
                )}
                
                <button
                  onClick={handleStartNewRound}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                >
                  Iniciar nueva ronda
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Botón para salir del juego */}
        {!isGameOver && (
          <button
            onClick={handleLeaveGame}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            Abandonar partida
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default GameControls; 