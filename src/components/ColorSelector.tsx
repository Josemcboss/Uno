import React from 'react';
import { CardColor } from '../types/game';

interface ColorSelectorProps {
  onColorSelect: (color: CardColor) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ onColorSelect }) => {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl">
        <h3 className="text-xl font-bold mb-4 text-center">Selecciona un color</h3>
        <div className="grid grid-cols-2 gap-4">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className={`
                w-24 h-24 rounded-lg transform transition-transform hover:scale-105
                ${color === 'red' ? 'bg-red-600' : ''}
                ${color === 'blue' ? 'bg-blue-600' : ''}
                ${color === 'green' ? 'bg-green-600' : ''}
                ${color === 'yellow' ? 'bg-yellow-500' : ''}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorSelector; 