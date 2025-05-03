import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

interface NotificationsProps {
  gameState: any;
  playerId: string;
}

const Notifications: React.FC<NotificationsProps> = ({ gameState, playerId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!gameState || !playerId) return;

    const currentPlayer = gameState.players.find((p: any) => p.id === playerId);
    if (!currentPlayer) return;

    // Notificar cuando sea el turno del jugador
    if (currentPlayer.isCurrentTurn) {
      addNotification({
        id: Date.now().toString(),
        message: '¡Es tu turno!',
        type: 'success'
      });
    }

    // Notificar cuando el jugador tenga solo una carta
    if (currentPlayer.cards.length === 1) {
      addNotification({
        id: 'uno-' + Date.now().toString(),
        message: '¡UNO!',
        type: 'warning'
      });
    }
  }, [gameState, playerId]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              mb-2 p-4 rounded-lg shadow-lg
              ${notification.type === 'success' ? 'bg-green-500' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
              ${notification.type === 'info' ? 'bg-blue-500' : ''}
              text-white font-bold
            `}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notifications; 