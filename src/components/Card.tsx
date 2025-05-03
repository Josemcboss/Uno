import React from 'react';
import { Card as CardType } from '../types/game';
import { 
  GiCardRandom, 
  GiCardDraw, 
  GiCardJoker
} from 'react-icons/gi';
import { IoIosRefresh } from 'react-icons/io';
import { FaBan } from 'react-icons/fa';

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
        return <FaBan className={iconSize} />;
      case 'reverse':
        return <IoIosRefresh className={iconSize} />;
      case 'draw2':
        return <GiCardDraw className={iconSize} />;
      case 'wild':
        return <GiCardRandom className={iconSize} />;
      case 'wildDraw4':
        return <GiCardJoker className={iconSize} />;
      default:
        return null;
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
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        ${sizeClasses[size]} rounded-xl shadow-lg flex items-center justify-center
        font-bold text-white transform transition-transform
        ${isPlayable ? 'hover:scale-110 cursor-pointer' : ''}
        ${card.color === 'red' ? 'bg-red-600' : ''}
        ${card.color === 'blue' ? 'bg-blue-600' : ''}
        ${card.color === 'green' ? 'bg-green-600' : ''}
        ${card.color === 'yellow' ? 'bg-yellow-500' : ''}
        ${card.color === 'black' ? 'bg-gray-800' : ''}
        relative overflow-hidden
      `}
    >
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 transform rotate-45 flex items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-4 bg-white m-4"
              style={{
                transform: `rotate(${i * 72}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Contenido de la carta */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {getCardIcon()}
        {card.type === 'number' && (
          <span className={size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-4xl'}>
            {getCardContent()}
          </span>
        )}
      </div>
    </div>
  );
};

export default Card; 