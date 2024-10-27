"use client";
import Image  from 'next/image';
import React, { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState(["Вы: Идипавлдпьав", "AI: ЛОАИТлываориплыватпов", "fdaksjhnfsd"]);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Добавляем новое сообщение в массив
    if (inputValue.trim()) {
      setMessages([...messages, `Вы: ${inputValue}`]); // Добавляем новое сообщение
      setInputValue(""); // Очищаем поле ввода после отправки
    }
  };

  return (
    <div className="min-h-screen p-1" style={{ background: 'linear-gradient(to bottom right, #FFFFFF, #BBBBBB)' }}>
      <div className="relative">
        <p className="mt-4 text-3xl font-bold text-center text-gray-800">Чат с нейросетью</p>
      </div>

      <div className="flex items-start justify-center"> 
        <div className="rounded w-1/2 mt-4 max-h-[80vh] overflow-y-auto"> {/* Устанавливаем максимальную высоту и добавляем прокрутку */}
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
        <div className="relative border rounded-lg border-black border-opacity-25 h-20 bg-transparent">
          <input
            type="text"
            placeholder="Введите запрос: ..."
            value={inputValue}
            onChange={handleInputChange}
            className="absolute inset-0 text-base font-bold text-gray-800 text-opacity-75 w-full h-full pl-4 pr-16 rounded-lg bg-transparent"
          />
          <button type="submit" className="w-12 h-12 absolute bg-gray-300 rounded-2xl right-4 top-2.5">
            <Image src={require("@/public/enter-svgrepo-com.svg")} height={52} width={45}/>
          </button>
        </div>
      </form>
    </div>
  );
}
