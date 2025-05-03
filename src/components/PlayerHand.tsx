import React from 'react';
import { Card as CardType } from '../types/game';
import Card from './Card';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  isCurrentTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardClick, isCurrentTurn }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 bg-opacity-50">
      <div className="flex justify-center gap-2 overflow-x-auto pb-4">
        {cards.map((card) => (
          <div key={card.id} className="-mr-12 last:mr-0">
            <Card
              card={card}
              onClick={() => onCardClick?.(card)}
              isPlayable={isCurrentTurn}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand; 