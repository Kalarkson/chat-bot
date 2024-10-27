"use client";
import Image from 'next/image';
import React, { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isGeneratingResponse) {
      addMessageToHistory(inputValue, 'user');
      await generateResponse(inputValue);
      setInputValue("");
    }
  };

  const addMessageToHistory = (message, type) => {
    setMessages((prevMessages) => {
      if (prevMessages.length === 0) {
        return [`${type === 'user' ? 'Вы' : 'AI'}: ${message}`];
      }

      const lastMessage = prevMessages[prevMessages.length - 1];

      if (lastMessage.startsWith('AI:') && type === 'bot') {
        return [
          ...prevMessages.slice(0, -1),
          lastMessage + message,
        ];
      }

      return [
        ...prevMessages,
        `${type === 'user' ? 'Вы' : 'AI'}: ${message}`,
      ];
    });
  };

  const generateResponse = async (userInput) => {
    const prompt = [...messages, `Вы: ${userInput}`].join('\n'); 

    try {
      setIsGeneratingResponse(true);
      const response = await fetch('http://95.28.220.36:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.1',
          prompt: prompt,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      reader.read().then(function processText({ done, value }) {
        if (done) {
          setIsGeneratingResponse(false);
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        lines.forEach(line => {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                const responseMessage = data.response;
                console.log(":" + responseMessage + ":");
                addMessageToHistory(responseMessage, 'bot');
              }
            } catch (error) {
              console.error('Ошибка парсинга JSON:', error);
            }
          }
        });
        return reader.read().then(processText);
      });
    } catch (error) {
      console.error('Ошибка:', error);
      addMessageToHistory(`Ошибка: ${error.message}`, 'bot');
      setIsGeneratingResponse(false);
    }
  };

  return (
    <div className="min-h-screen p-1 flex flex-col" style={{ background: 'linear-gradient(to bottom right, #FFFFFF, #BBBBBB)' }}>
      <div className="relative">
        <p className="mt-4 text-3xl font-bold text-center text-gray-800">Чат с нейросетью</p>
      </div>
  
      <div className="flex items-start justify-center"> 
        <div className="rounded w-1/2 mt-4 max-h-[80vh] overflow-y-auto">
          <ul className="list-none p-0">
            {messages.map((msg, index) => (
              <li key={index} className="py-2 relative border-b-2 border-gray-800">
                <span className="text-[20px] text-gray-800">
                  <strong>{msg.substring(0, 3)}</strong>{msg.substring(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
  
      <form onSubmit={handleSubmit} className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4 w-[70%]"> 
        <div className="relative rounded-lg  bg-transparent">
          <textarea
            placeholder="Введите запрос: ..."
            value={inputValue}
            onChange={handleInputChange}
            className="border border-black border-opacity-25 w-full h-full pl-4 pr-16 pt-4 pb-4 rounded-lg bg-transparent text-base font-bold text-gray-800 text-opacity-75 resize-none"
            rows={3} // Устанавливаем количество строк по умолчанию
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Предотвращаем отправку формы при нажатии Enter
                handleSubmit(e); // Вызываем обработчик отправки
              }
            }}
          />
          <button type="submit" className="w-12 h-12 absolute bg-gray-300 rounded-2xl right-4 top-2.5">
            <Image src={require("@/public/enter-svgrepo-com.svg")} height={52} width={45} />
          </button>
        </div>
      </form>
    </div>
  );
}



{/* 
<form onSubmit={handleSubmit} className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4 w-[70%]"> 
<div className="relative border rounded-lg border-black border-opacity-25 h-20 bg-transparent">
  <input
    type="text"
    placeholder="Введите запрос: ..."
    value={inputValue}
    onChange={handleInputChange}
    className="absolute inset-0 text-base font-bold text-gray-800 text-opacity-75 w-full h-full pl-4 pr-16 rounded-lg bg-transparent"
  />
  <button type="submit" className="w-12 h-12 absolute bg-gray-300 rounded-2xl right-4 top-2.5">
    <Image src={require("@/public/enter-svgrepo-com.svg")} height={52} width={45} />
  </button>
</div>
</form> 
*/}