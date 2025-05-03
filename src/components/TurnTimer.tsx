import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TurnTimerProps {
  isCurrentTurn: boolean;
  timeLimit: number;
  onTimeUp: () => void;
}

const TurnTimer: React.FC<TurnTimerProps> = ({
  isCurrentTurn,
  timeLimit,
  onTimeUp,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!isCurrentTurn) {
      setTimeLeft(timeLimit);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCurrentTurn, timeLimit, onTimeUp]);

  const percentage = (timeLeft / timeLimit) * 100;
  const color = percentage > 50 ? 'green' : percentage > 25 ? 'yellow' : 'red';

  return (
    <div className="fixed top-4 left-4 w-32">
      {isCurrentTurn && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-lg p-4 shadow-lg"
        >
          <div className="text-center mb-2 font-bold">
            Tiempo restante
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${percentage}%` }}
              className={`absolute h-full rounded-full ${
                color === 'green'
                  ? 'bg-green-500'
                  : color === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
          <div className="text-center mt-2">
            {timeLeft}s
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TurnTimer; 