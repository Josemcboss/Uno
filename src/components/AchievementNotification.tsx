import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '../services/Achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3"
      >
        <div className="text-4xl">{achievement.icon}</div>
        <div>
          <h3 className="font-bold text-lg">¡Logro Desbloqueado!</h3>
          <p className="font-semibold">{achievement.title}</p>
          <p className="text-sm opacity-90">{achievement.description}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementNotification; 