import React, { useState, useEffect, useRef } from 'react';
import { GameClient } from '../lib/socketConfig';

export interface Message {
  id: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  gameId: string;
  playerName: string;
  socket: GameClient | null;
}

const Chat: React.FC<ChatProps> = ({ gameId, playerName, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simular recepción de un mensaje de bienvenida al inicio
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      playerName: 'Sistema',
      text: '¡Bienvenido al chat del juego!',
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const message: Message = {
      id: Date.now().toString(),
      playerName,
      text: newMessage,
      timestamp: Date.now(),
    };

    // Añadimos el mensaje a nuestra lista local
    setMessages(prev => [...prev, message]);
    
    // Aquí podríamos implementar el envío del mensaje al servidor
    // si quisiéramos añadir esa funcionalidad en el futuro
    
    setNewMessage('');
  };

  return (
    <div className="fixed right-4 bottom-48 w-80 bg-white rounded-xl shadow-lg">
      <div className="p-4 border-b">
        <h3 className="font-bold">Chat del Juego</h3>
      </div>
      <div className="h-64 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 ${
              message.playerName === playerName
                ? 'text-right'
                : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.playerName === playerName
                  ? 'bg-blue-500 text-white'
                  : message.playerName === 'Sistema' 
                    ? 'bg-green-100' 
                    : 'bg-gray-200'
              }`}
            >
              <div className="font-bold text-sm">
                {message.playerName}
              </div>
              <div>{message.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 