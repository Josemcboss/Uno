import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  gameId: string;
  playerName: string;
  socket: any;
}

const Chat: React.FC<ChatProps> = ({ gameId, playerName, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('chatMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chatMessage');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      playerName,
      text: newMessage,
      timestamp: Date.now(),
    };

    socket.emit('sendMessage', { gameId, message });
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