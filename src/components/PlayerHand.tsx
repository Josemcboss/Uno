import React, { useEffect, useState } from 'react';
import { Card as CardType } from '../types/game';
import Card from './Card';
import { useWindowSize } from '../hooks/useWindowSize';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  isCurrentTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardClick, isCurrentTurn }) => {
  const { width } = useWindowSize();
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [overlap, setOverlap] = useState<number>(-48);
  const [maxRotation, setMaxRotation] = useState<number>(15);

  useEffect(() => {
    if (width < 640) { // móvil
      setCardSize('sm');
      setOverlap(-20);
      setMaxRotation(10);
    } else if (width < 1024) { // tablet
      setCardSize('md');
      setOverlap(-35);
      setMaxRotation(12);
    } else { // desktop
      setCardSize('lg');
      setOverlap(-50);
      setMaxRotation(15);
    }
  }, [width]);

  const calculateRotation = (index: number, totalCards: number): number => {
    const middleIndex = (totalCards - 1) / 2;
    const relativePosition = index - middleIndex;
    const rotation = (relativePosition / middleIndex) * maxRotation;
    return rotation;
  };

  const calculateTranslateY = (index: number, totalCards: number): number => {
    const middleIndex = (totalCards - 1) / 2;
    const relativePosition = Math.abs(index - middleIndex);
    const maxOffset = 10;
    return relativePosition * maxOffset;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-gray-800 bg-opacity-50">
      <div 
        className="flex justify-center items-end overflow-x-auto pb-2 sm:pb-4 px-2 sm:px-8"
        style={{
          minHeight: cardSize === 'sm' ? '100px' : cardSize === 'md' ? '140px' : '212px',
          touchAction: 'pan-x',
          WebkitOverflowScrolling: 'touch',
          perspective: '1000px'
        }}
      >
        {cards.map((card, index) => {
          const rotation = calculateRotation(index, cards.length);
          const translateY = calculateTranslateY(index, cards.length);
          
          return (
            <div 
              key={card.id} 
              className={`
                transition-all duration-200 ease-out
                ${isCurrentTurn ? 'hover:translate-y-[-20px] hover:scale-110 active:translate-y-[-10px]' : ''}
                touch-manipulation
              `}
              style={{ 
                marginRight: index === cards.length - 1 ? 0 : `${overlap}px`,
                zIndex: index,
                transform: `
                  rotateZ(${rotation}deg)
                  translateY(${translateY}px)
                `,
                transformOrigin: 'bottom center'
              }}
            >
              <Card
                card={card}
                onClick={() => isCurrentTurn && onCardClick?.(card)}
                isPlayable={isCurrentTurn}
                size={cardSize}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand; 