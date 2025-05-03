import React from 'react';
import { GameState, Player } from '../types/game';
import Card from './Card';
import { motion } from 'framer-motion';
import { GiCardDraw } from 'react-icons/gi';

interface GameTableProps {
  gameState: GameState;
  currentPlayer: Player;
  onDrawCard: () => void;
  isCurrentPlayerTurn: boolean;
}

const GameTable: React.FC<GameTableProps> = ({
  gameState,
  currentPlayer,
  onDrawCard,
  isCurrentPlayerTurn
}) => {
  if (!gameState || !currentPlayer) {
    return null;
  }

  return (
    <div className="relative w-full h-[calc(100vh-160px)] sm:h-[calc(100vh-200px)] bg-green-800 shadow-inner">
      {/* Efecto de textura de fieltro */}
      <div className="absolute inset-0 bg-[url('/felt-texture.png')] opacity-20 mix-blend-multiply" />
      
      {/* Área central de la mesa */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center space-x-4 sm:space-x-8">
          {/* Mazo para robar */}
          <motion.div
            whileHover={isCurrentPlayerTurn ? { scale: 1.05 } : {}}
            whileTap={isCurrentPlayerTurn ? { scale: 0.95 } : {}}
            className={`relative ${isCurrentPlayerTurn ? 'cursor-pointer active:scale-95' : ''} touch-manipulation`}
            onClick={isCurrentPlayerTurn ? onDrawCard : undefined}
          >
            {/* Cartas apiladas del mazo */}
            {[...Array(Math.min(3, gameState.deck.length))].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `translateY(${i * -1}px)`,
                  zIndex: i,
                }}
              >
                <div className="w-16 h-24 sm:w-24 sm:h-36 md:w-28 md:h-40 lg:w-32 lg:h-48 rounded-lg bg-blue-900 border-2 border-white shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white transform rotate-45 text-2xl sm:text-4xl font-bold">UNO</div>
                  </div>
                </div>
              </div>
            ))}
            {isCurrentPlayerTurn && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2"
              >
                <GiCardDraw className="text-xl sm:text-2xl text-white" />
              </motion.div>
            )}
          </motion.div>

          {/* Pila de descarte */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            {gameState.discardPile.slice(-3).map((card, i, arr) => (
              <div
                key={card.id}
                className="absolute"
                style={{
                  transform: `rotate(${(i - 1) * 5}deg)`,
                  zIndex: i,
                }}
              >
                <Card 
                  card={card} 
                  size={i === arr.length - 1 ? 
                    (window.innerWidth < 640 ? "sm" : "lg") : 
                    (window.innerWidth < 640 ? "sm" : "md")
                  } 
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Información de otros jugadores */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 sm:gap-4 px-2 sm:px-4 flex-wrap">
        {gameState.players
          .filter(p => p && p.id && p.id !== currentPlayer.id)
          .map(player => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                px-2 sm:px-4 py-1 sm:py-2 rounded-lg
                ${gameState.currentPlayerIndex === gameState.players.findIndex(p => p && p.id === player.id) ? 'bg-yellow-500' : 'bg-gray-800'}
                text-white shadow-lg
              `}
            >
              <div className="text-center">
                <div className="text-sm sm:text-base font-bold">{player.name}</div>
                <div className="text-xs sm:text-sm">{player.cards.length} cartas</div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
};

export default GameTable; 