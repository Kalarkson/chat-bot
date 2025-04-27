<template>
  <div class="bg-gradient-to-b from-red-200 to-cyan-200 flex flex-col items-center justify-between min-h-screen text-black font-roboto overflow-hidden">
    <main class="flex flex-col items-center w-full flex-grow">
      <nav class="w-full p-4">
        <button @click="clearChat" class="bg-blue-500 text-white px-5 py-2 rounded text-sm">Очистить чат</button>
      </nav>
      <h1 class="text-2xl font-semibold mb-4" v-if="showTitle">Чат-бот помощник</h1>
      <div class="chat-container flex-grow rounded-lg mb-2 p-4 overflow-y-auto flex flex-col h-96" id="chatContainer">
        <div :class="messageClass(message.type)" :key="index" v-for="(message, index) in messages">
  <div class="flex items-start" v-if="message.type === 'ai'">
    <img src="https://cdn-icons-png.flaticon.com/128/10053/10053283.png" alt="Логотип ИИ" class="w-8 h-8 rounded-full mr-2">
    <div class="text-gray-700 p-2 rounded-lg w-full text-lg" v-html="formatMessage(message.text)"></div>
  </div>
  <div class="flex items-start justify-end" v-else>
    <div class="text-gray-850 p-2 rounded-lg w-full text-base" v-html="formatMessage(message.text)"></div>
    <img src="https://cdn-icons-png.flaticon.com/128/1077/1077063.png" alt="Аватар пользователя" class="w-8 h-8 rounded-l ml-2">
  </div>
</div>
      </div>
    </main>
    <div class="w-full flex flex-col items-center p-4">
      <div class="input-container flex mb-2">
        <textarea 
          id="messageInput" 
          placeholder="Сообщение ассистенту" 
          class="flex-grow p-2 border border-black shadow-[0_0_0_2px_black] rounded-l text-black text-base resize-none overflow-y-auto" 
          rows="1" 
          v-model="newMessage" 
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.shift.enter.exact.prevent="newMessage += '\n'"
        ></textarea>
        <button @click="sendMessage" class="bg-blue-500 text-white px-6 py-3 shadow-[0_0_0_2px_black] rounded-r" :disabled="isGenerating">Отправить</button>
      </div>
      <p class="text-gray-500 text-sm">Made in Russia</p>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'; 
import katex from 'katex'; 
import 'katex/dist/katex.min.css';

export default {
  data() {
    return {
      showTitle: true,
      newMessage: '',
      messages: [],
      chatHistory: [],
      isGenerating: false,
      formattedText: '',
      isThinking: false, 
      currentBuffer: '' 
    };
  },
  methods: {
    formatMessage(text) {
      let html = marked(text);
      const customLatexRegex = /\(([^()]+)\)/g; 
      html = html.replace(customLatexRegex, (match, formula) => {
        if (formula.includes('\\')) { 
          return katex.renderToString(formula, { throwOnError: false, displayMode: false });
        }
        return match; 
      });

      html = html.replace(/(\w+)_([^{}\s]+)/g, '$1<sub>$2</sub>');

      html = html.replace(/(\w+|\w+\/\w+)\^(\d+)/g, '$1<sup>$2</sup>');

      html = html.replace(/(\w+)\s*\/\s*(\w+)/g, '$1/<sub>$2</sub>'); 

      return html;
    },
    async sendMessage() {
      if (this.newMessage.trim() !== '') {
        this.isGenerating = true;
        this.messages.push({ type: 'user', text: this.newMessage });
        this.chatHistory.push({ role: 'user', content: this.newMessage });
        const response = await this.sendToApi(this.chatHistory);
        if (response) {
          this.messages.push({ type: 'ai', text: '' });
          this.chatHistory.push({ role: 'assistant', content: '' });
          this.formattedText = ''; 
          this.isThinking = false;
          this.currentBuffer = '';
          this.processStreamedResponse(response);
        } else {
          this.messages.push({ type: 'ai', text: 'Превышено время ожидания сервера💤' });
          this.isGenerating = false;
        }
        this.newMessage = '';
        this.showTitle = false;
        this.$nextTick(() => {
          const chatContainer = this.$el.querySelector('#chatContainer');
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      }
    },
    async sendToApi(history) {
      try {
        const response = await fetch('http://128.69.11.50:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'chat-bot', messages: history })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Неизвестная ошибка');
        }
        return response.body;
      } catch (error) {
        console.error('Error sending message to API:', error);
        return null;
      }
    },
    async processStreamedResponse(stream) {
      const reader = stream.getReader();
      const lastMessageIndex = this.messages.length - 1;
      const readStream = async () => {
        const { done, value } = await reader.read();
        if (done) {
          this.updateMessageText();
          this.isGenerating = false;
          return;
        }
        const chunk = new TextDecoder("utf-8").decode(value);
        const jsonLines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of jsonLines) {
          try {
            const data = JSON.parse(line);
            if (data.message && data.message.content) {
              const content = data.message.content;
              this.currentBuffer += content;
              this.parseAndFormat();
              this.updateMessageText();
              if (lastMessageIndex >= 0) {
                const strippedContent = this.formattedText.replace(/<[^>]+>/g, '');
                this.chatHistory[this.chatHistory.length - 1].content = strippedContent;
              }
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
        this.$nextTick(() => {
          const chatContainer = this.$el.querySelector('#chatContainer');
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
        readStream();
      };
      readStream();
    },
    parseAndFormat() {
      while (this.currentBuffer.length > 0) {
        if (!this.isThinking && this.currentBuffer.includes('<think>')) {
          const textBeforeTag = this.currentBuffer.substring(0, this.currentBuffer.indexOf('<think>'));
          this.formattedText += textBeforeTag;
          this.currentBuffer = this.currentBuffer.substring(this.currentBuffer.indexOf('<think>') + '<think>'.length);
          this.isThinking = true;
          this.formattedText += '<div class="thought-section">';
        } else if (this.isThinking && this.currentBuffer.includes('</think>')) {
          const textBeforeTag = this.currentBuffer.substring(0, this.currentBuffer.indexOf('</think>'));
          this.formattedText += textBeforeTag;
          this.currentBuffer = this.currentBuffer.substring(this.currentBuffer.indexOf('</think>') + '</think>'.length);
          this.formattedText += '</div>';
          this.isThinking = false;
        } else {
          if (this.isThinking) {
            this.formattedText += this.currentBuffer;
          } else {
            this.formattedText += this.currentBuffer;
          }
          this.currentBuffer = '';
        }
        this.updateMessageText();
      }
    },
    updateMessageText() {
      const lastMessageIndex = this.messages.length - 1;
      if (lastMessageIndex >= 0 && this.messages[lastMessageIndex].type === 'ai') {
        this.messages[lastMessageIndex].text = this.formattedText;
      }
    },
    clearChat() {
      this.messages = [];
      this.chatHistory = [];
      this.showTitle = true;
      this.formattedText = '';
      this.isThinking = false;
      this.currentBuffer = '';
    },
    messageClass(type) {
      return type === 'ai' ? 'flex justify-start mb-2' : 'flex justify-end mb-2';
    }
  }
};
</script>