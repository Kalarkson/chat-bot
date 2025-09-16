import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ChatInput = ({ onSendMessage }: { onSendMessage: (message: string) => void }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflow = 'hidden';
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      const previousScrollTop = textareaRef.current.scrollTop;
      textareaRef.current.style.height = 'auto';
      const singleLineHeight = 24;
      const maxHeight = 8 * 24;
      const currentScrollHeight = textareaRef.current.scrollHeight;
      if (input === '') {
        textareaRef.current.style.height = `${singleLineHeight}px`;
        textareaRef.current.style.overflow = 'hidden';
      } 
      else if (currentScrollHeight <= maxHeight) {
        textareaRef.current.style.height = `${currentScrollHeight}px`;
        textareaRef.current.style.overflow = 'hidden';
      } 
      else {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflow = 'auto';
      }
      textareaRef.current.scrollTop = previousScrollTop;
    }
  }, [input]);

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-8 px-2 mobile:px-4">
      <form 
        onSubmit={handleSubmit} 
        className="mx-auto max-w-3xl w-full bg-chat-input rounded-2xl ring-1 ring-[#38383a] p-3"
      >
        <div className="flex flex-col w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-chat-input text-white placeholder-gray-400 
                     rounded-xl outline-none ring-0
                     text-sm mobile:text-base tablet:text-lg 
                     w-full
                     transition-all duration-200
                     border-none resize-none leading-6
                     focus:ring-0 focus:outline-none focus:border-none
                     scrollbar-thin
                     overflow-auto"
            placeholder="Задайте вопрос AI..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="bg-[#5686fe] text-white rounded-3xl ring-1 hover:bg-[#4970fe] hover:ring-[#3964fe]
                        transition-colors duration-200
                        flex items-center justify-center
                        w-8 h-8"
              disabled={!input.trim()}
            >
              <ArrowUp className="w-5 h-5" color="#eff0f1" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;