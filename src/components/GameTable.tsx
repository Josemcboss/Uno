import React from 'react';
import { GameState, Player } from '../types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { GiCardDraw } from 'react-icons/gi';
import OpponentHand from './OpponentHand';

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
  // Logs para depuración
  console.log('GameTable - Estado actual:', {
    gameState: gameState?.id,
    currentPlayerId: currentPlayer?.id,
    playersCount: gameState?.players?.length,
    isCurrentPlayerTurn
  });

  if (!gameState || !currentPlayer) {
    console.log('GameTable - Retornando null por falta de datos:', {
      hasGameState: !!gameState,
      hasCurrentPlayer: !!currentPlayer
    });
    return null;
  }

  // Filtrar jugadores de forma segura
  const otherPlayers = gameState.players.filter(p => {
    const isValidPlayer = p && 
      typeof p.id === 'string' && 
      p.id !== currentPlayer.id && 
      typeof p.name === 'string' && 
      Array.isArray(p.cards);
      
    if (!isValidPlayer) {
      console.log('GameTable - Jugador inválido encontrado:', {
        player: p,
        reason: !p ? 'jugador nulo' :
                !p.id ? 'sin ID' :
                typeof p.id !== 'string' ? 'ID no es string' :
                p.id === currentPlayer.id ? 'es jugador actual' :
                !p.name ? 'sin nombre' :
                !Array.isArray(p.cards) ? 'cartas no es array' :
                'razón desconocida'
      });
    }
    return isValidPlayer;
  });

  const getOpponentPosition = (index: number, totalPlayers: number): 'top' | 'left' | 'right' => {
    const playerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
    const relativePosition = (index - playerIndex + totalPlayers) % totalPlayers;
    
    switch (totalPlayers) {
      case 2:
        return 'top';
      case 3:
        return relativePosition === 1 ? 'left' : 'right';
      case 4:
        switch (relativePosition) {
          case 1:
            return 'left';
          case 2:
            return 'top';
          case 3:
            return 'right';
          default:
            return 'top';
        }
      default:
        return 'top';
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-160px)] sm:h-[calc(100vh-200px)]">
      {/* Marco de madera con gradiente */}
      <div className="absolute inset-0 rounded-lg" style={{
        background: `
          linear-gradient(45deg, 
            #8B4513 0%,
            #A0522D 25%,
            #CD853F 50%,
            #A0522D 75%,
            #8B4513 100%
          )`,
        padding: '20px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
      }}>
        {/* Textura de vetas de madera */}
        <div className="absolute inset-0 opacity-30" style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.1) 10px,
              rgba(0,0,0,0.1) 20px
            )
          `
        }} />
      </div>
      
      {/* Mesa de juego */}
      <div className="absolute inset-[20px] bg-green-800 shadow-inner rounded-lg overflow-hidden">
        {/* Efecto de textura de fieltro */}
        <div className="absolute inset-0 bg-[url('/felt-texture.png')] opacity-20 mix-blend-multiply" />
        
        {/* Botón de robar carta */}
        <motion.div
          whileHover={isCurrentPlayerTurn ? { scale: 1.05 } : {}}
          whileTap={isCurrentPlayerTurn ? { scale: 0.95 } : {}}
          className={`
            absolute right-4 top-1/2 transform -translate-y-1/2
            ${isCurrentPlayerTurn ? 'cursor-pointer' : 'opacity-50'}
            touch-manipulation z-50
          `}
          onClick={isCurrentPlayerTurn ? onDrawCard : undefined}
        >
          <AnimatePresence mode="popLayout">
            {/* Cartas apiladas del mazo */}
            {[...Array(Math.min(3, gameState.deck.length))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 200, opacity: 0 }}
                animate={{ 
                  x: i * -1,
                  opacity: 1,
                  transition: { delay: i * 0.1 }
                }}
                exit={{ x: -200, opacity: 0 }}
                className="absolute"
                style={{ zIndex: i }}
              >
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-blue-900 border-2 border-white shadow-lg rotate-90">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white transform -rotate-90 text-lg sm:text-xl font-bold">UNO</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
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

        {/* Área central de la mesa */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Pila de descarte */}
          <AnimatePresence mode="popLayout">
            {gameState.discardPile.slice(-3).map((card, i, arr) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: (i - 1) * 5,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }
                }}
                exit={{ 
                  scale: 0,
                  transition: { duration: 0.2 }
                }}
                className="absolute"
                style={{ zIndex: i }}
              >
                <Card 
                  card={card} 
                  size={i === arr.length - 1 ? 
                    (window.innerWidth < 640 ? "sm" : "lg") : 
                    (window.innerWidth < 640 ? "sm" : "md")
                  } 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Manos de los oponentes */}
        <AnimatePresence>
          {otherPlayers.map(player => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <OpponentHand
                cardCount={player.cards.length}
                playerName={player.name}
                isCurrentTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === player.id)}
                position={getOpponentPosition(
                  gameState.players.findIndex(p => p.id === player.id),
                  gameState.players.length
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameTable; 