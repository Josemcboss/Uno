import React, { useState, useEffect, useRef } from 'react';
import { GameClient } from '../lib/socketConfig';
import { Message } from '../types/chat';

interface ChatProps {
  playerName: string;
  socket: GameClient | null;
}

const Chat: React.FC<ChatProps> = ({ playerName, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket) {
      socket.onChatMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
      };
    }
  }, [socket]);

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

    socket.sendChatMessage(message);
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