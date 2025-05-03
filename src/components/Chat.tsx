import React, { useState, useEffect, useRef } from 'react';
import { GameClient } from '../lib/socketConfig';
import { Message } from '../types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatProps {
  playerName: string;
  socket: GameClient | null;
}

const Chat: React.FC<ChatProps> = ({ playerName, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Suscribirse a los mensajes del chat
    socket.onChatMessage = (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    };

    return () => {
      // Limpiar la suscripción al desmontar
      socket.onChatMessage = () => {};
    };
  }, [socket, isOpen]);

  useEffect(() => {
    // Scroll al último mensaje
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const message: Message = {
      id: crypto.randomUUID(),
      playerName,
      content: newMessage.trim(),
      timestamp: Date.now()
    };

    const success = await socket.sendChatMessage(message);
    if (success) {
      setNewMessage('');
      // No necesitamos añadir el mensaje manualmente aquí
      // ya que lo recibiremos a través del evento onChatMessage
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Botón del chat con contador de mensajes no leídos */}
      <button
        onClick={toggleChat}
        className="fixed bottom-24 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 bottom-36 w-80 bg-white rounded-lg shadow-xl z-50"
          >
            <div className="flex flex-col h-96">
              {/* Encabezado del chat */}
              <div className="flex justify-between items-center p-3 border-b bg-blue-500 text-white rounded-t-lg">
                <h3 className="font-bold">Chat del juego</h3>
                <button onClick={toggleChat} className="text-white hover:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-2 rounded-lg ${
                      message.playerName === playerName
                        ? 'bg-blue-100 ml-8'
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-700">
                      {message.playerName}
                    </div>
                    <div className="text-gray-800">{message.content}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulario de entrada */}
              <form onSubmit={handleSubmit} className="p-3 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 p-2 border rounded text-black"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat; 