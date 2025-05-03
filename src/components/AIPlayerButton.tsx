import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GiRobotGolem } from 'react-icons/gi';

interface AIPlayerButtonProps {
  onAddAI: () => Promise<boolean>;
  disabled: boolean;
}

const AIPlayerButton: React.FC<AIPlayerButtonProps> = ({ onAddAI, disabled }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isAdding || disabled) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      const success = await onAddAI();
      if (!success) {
        setError('No se pudo añadir el jugador IA');
      }
    } catch (err) {
      setError('Error al añadir el jugador IA');
      console.error('Error añadiendo IA:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <motion.button
        whileHover={!disabled && !isAdding ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isAdding ? { scale: 0.95 } : {}}
        onClick={handleClick}
        className={`
          w-full flex items-center justify-center gap-2 p-2 rounded
          ${disabled ? 'bg-gray-400 cursor-not-allowed' : 
            isAdding ? 'bg-blue-400 cursor-wait' : 
            'bg-blue-500 hover:bg-blue-600'}
          text-white transition-colors
        `}
        disabled={disabled || isAdding}
      >
        <GiRobotGolem className="text-xl" />
        <span>
          {disabled ? 'IA ya añadida' :
           isAdding ? 'Añadiendo IA...' :
           'Añadir jugador IA'}
        </span>
      </motion.button>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default AIPlayerButton; 