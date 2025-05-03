import React from 'react';
import { Card as CardType } from '../types/game';
import { 
  GiCardRandom, 
  GiCardPlay, 
  GiCardDraw, 
  GiCardDiscard,
  GiCardPick,
  GiCardJoker
} from 'react-icons/gi';
import { IoIosRefresh } from 'react-icons/io';
import { FaBan } from 'react-icons/fa';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isPlayable = false }) => {
  const getCardIcon = () => {
    switch (card.type) {
      case 'skip':
        return <FaBan className="text-4xl" />;
      case 'reverse':
        return <IoIosRefresh className="text-4xl" />;
      case 'draw2':
        return <GiCardDraw className="text-4xl" />;
      case 'wild':
        return <GiCardRandom className="text-4xl" />;
      case 'wild4':
        return <GiCardJoker className="text-4xl" />;
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

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        w-24 h-36 rounded-xl shadow-lg flex items-center justify-center
        font-bold text-2xl text-white transform transition-transform
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
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Esquina superior izquierda */}
        <div className="absolute top-2 left-2 text-sm flex flex-col items-center">
          <span>{getCardContent()}</span>
          {getCardIcon() && (
            <div className="transform scale-50">
              {getCardIcon()}
            </div>
          )}
        </div>

        {/* Centro */}
        <div className="flex flex-col items-center justify-center">
          {card.type === 'number' ? (
            <span className="text-6xl font-bold">{card.value}</span>
          ) : (
            <>
              {getCardIcon()}
              <span className="text-sm mt-2">{card.type.toUpperCase()}</span>
            </>
          )}
        </div>

        {/* Esquina inferior derecha */}
        <div className="absolute bottom-2 right-2 text-sm flex flex-col items-center transform rotate-180">
          <span>{getCardContent()}</span>
          {getCardIcon() && (
            <div className="transform scale-50">
              {getCardIcon()}
            </div>
          )}
        </div>

        {/* Marca de agua del logo UNO */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="text-6xl font-black transform -rotate-45">
            UNO
          </div>
        </div>
      </div>

      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white opacity-10" />
    </div>
  );
};

export default Card; 