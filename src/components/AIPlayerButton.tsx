import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';

interface AIPlayerButtonProps {
  onAddAI: () => void;
  disabled?: boolean;
}

const AIPlayerButton: React.FC<AIPlayerButtonProps> = ({ onAddAI, disabled }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAddAI}
      disabled={disabled}
      className={`
        w-full bg-purple-500 text-white p-2 rounded
        hover:bg-purple-600 transition-colors flex items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <FaRobot className="text-xl" />
      <span>Añadir Jugador IA</span>
    </motion.button>
  );
};

export default AIPlayerButton; 