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

  useEffect(() => {
    if (width < 640) { // móvil
      setCardSize('sm');
      setOverlap(-32);
    } else if (width < 1024) { // tablet
      setCardSize('md');
      setOverlap(-48);
    } else { // desktop
      setCardSize('lg');
      setOverlap(-64);
    }
  }, [width]);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 bg-opacity-50">
      <div 
        className="flex justify-center items-end overflow-x-auto pb-4 px-4 md:px-8 lg:px-12"
        style={{
          minHeight: cardSize === 'sm' ? '96px' : cardSize === 'md' ? '144px' : '192px'
        }}
      >
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className="transition-transform hover:translate-y-[-20px]"
            style={{ 
              marginRight: index === cards.length - 1 ? 0 : `${overlap}px`,
              zIndex: index
            }}
          >
            <Card
              card={card}
              onClick={() => onCardClick?.(card)}
              isPlayable={isCurrentTurn}
              size={cardSize}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand; 