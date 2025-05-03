import React from 'react';
import { Card as CardType } from '../types/game';
import { 
  GiCardRandom, 
  GiCardDraw, 
  GiCardJoker,
  GiCardExchange,
  GiCardPlay,
  GiCardDiscard
} from 'react-icons/gi';
import { motion } from 'framer-motion';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ card, onClick, isPlayable = false, size = 'md' }) => {
  const getCardIcon = () => {
    const iconSize = size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-4xl' : 'text-5xl';
    switch (card.type) {
      case 'skip':
        return <GiCardDiscard className={iconSize} />;
      case 'reverse':
        return <GiCardExchange className={iconSize} />;
      case 'draw2':
        return <GiCardDraw className={iconSize} />;
      case 'wild':
        return <GiCardRandom className={iconSize} />;
      case 'wildDraw4':
        return <GiCardJoker className={iconSize} />;
      default:
        return <GiCardPlay className={iconSize} />;
    }
  };

  const getCardContent = () => {
    if (card.type === 'number') {
      return card.value?.toString();
    }
    return card.type.toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-16 h-24 text-lg',
    md: 'w-24 h-36 text-2xl',
    lg: 'w-32 h-48 text-3xl'
  };

  return (
    <motion.div
      whileHover={isPlayable ? { scale: 1.1, y: -10 } : {}}
      className={`
        ${sizeClasses[size]} rounded-xl shadow-xl
        font-bold text-white transform
        ${isPlayable ? 'cursor-pointer' : ''}
        ${card.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : ''}
        ${card.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : ''}
        ${card.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-700' : ''}
        ${card.color === 'yellow' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
        ${card.color === 'black' ? 'bg-gradient-to-br from-gray-700 to-gray-900' : ''}
        relative overflow-hidden border-2 border-white
      `}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Esquinas superiores */}
      <div className="absolute top-2 left-2 flex flex-col items-center">
        <span className="text-sm font-bold">{getCardContent()}</span>
        <div className="transform scale-50">{getCardIcon()}</div>
      </div>

      {/* Centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        {card.type === 'number' ? (
          <span className={`
            ${size === 'sm' ? 'text-4xl' : size === 'md' ? 'text-6xl' : 'text-7xl'}
            font-bold drop-shadow-lg
          `}>
            {card.value}
          </span>
        ) : (
          <div className="flex flex-col items-center">
            {getCardIcon()}
            <span className="text-sm mt-2 font-bold">{card.type}</span>
          </div>
        )}
      </div>

      {/* Esquinas inferiores */}
      <div className="absolute bottom-2 right-2 flex flex-col items-center transform rotate-180">
        <span className="text-sm font-bold">{getCardContent()}</span>
        <div className="transform scale-50">{getCardIcon()}</div>
      </div>

      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white opacity-10" />
      
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 transform rotate-45">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1 bg-white"
              style={{
                top: `${i * 20}%`,
                transform: `rotate(${i * 36}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Card; 