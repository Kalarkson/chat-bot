'use client';

import React, { useState } from 'react';
import Footer from '../components/Footer';
import ChatInput from '../components/ChatInput';
import MessageBubble from '../components/MessageBubble';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Привет! Я твой AI-ассистент.', isUser: false },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = { id: messages.length + 1, text, isUser: true };
    setMessages([...messages, newMessage]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: 'Это пример ответа AI!', isUser: false },
      ]);
    }, 500);
  };

  return (
    <main className="bg-[#151517] min-h-screen bg-mobile-bg mobile:bg-mobile-bg tablet:bg-tablet-bg desktop:bg-desktop-bg flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col px-4 pb-20"> {/* Добавил отступ снизу */}
        <div className="flex-1 py-4">
          <div className="flex flex-col gap-4 w-full">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
        <div className="pt-4">
          <ChatInput onSendMessage={handleSendMessage} />
          <Footer />
        </div>
      </div>
    </main>
  );
}