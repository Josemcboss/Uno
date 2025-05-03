import React from 'react';
import { motion } from 'framer-motion';

interface OpponentHandProps {
  cardCount: number;
  playerName: string;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
}

const OpponentHand: React.FC<OpponentHandProps> = ({
  cardCount,
  playerName,
  isCurrentTurn,
  position
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'left-4 top-1/2 transform -translate-y-1/2 rotate-90';
      case 'right':
        return 'right-4 top-1/2 transform -translate-y-1/2 -rotate-90';
      default:
        return '';
    }
  };

  const getOverlap = () => {
    // Ajustar el solapamiento según la cantidad de cartas
    if (cardCount <= 4) return -15;
    if (cardCount <= 8) return -25;
    return -35;
  };

  return (
    <div className={`absolute ${getPositionStyles()}`}>
      <div className="text-center mb-2">
        <span className={`font-bold ${isCurrentTurn ? 'text-yellow-400' : 'text-white'}`}>
          {playerName}
        </span>
      </div>
      <div className="flex">
        {[...Array(cardCount)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              marginLeft: index === 0 ? 0 : `${getOverlap()}px`,
              zIndex: index
            }}
          >
            <div 
              className={`
                w-12 h-16 sm:w-14 sm:h-20 
                rounded-lg bg-blue-900 border-2 border-white shadow-lg
                transform transition-transform duration-200
                ${isCurrentTurn ? 'scale-105' : ''}
              `}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white transform rotate-45 text-lg font-bold">UNO</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OpponentHand; 