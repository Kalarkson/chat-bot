<template>
  <div class="bg-gradient-to-b from-white to-gray-200 flex flex-col items-center justify-between min-h-screen text-black font-roboto overflow-hidden">
    <main class="flex flex-col items-center w-full flex-grow">
      <nav class="w-full p-4">
        <button @click="clearChat" class="bg-blue-500 text-white px-5 py-2 rounded text-sm">+ Chat</button>
      </nav>
      <h1 class="text-2xl font-semibold mb-4" v-if="showTitle">DeepSeek AI Assistant</h1>
      <div class="chat-container flex-grow rounded-lg mb-2 p-4 overflow-y-auto flex flex-col h-96" id="chatContainer">
        <div :class="messageClass(message.type)" :key="index" v-for="(message, index) in messages">
          <div class="flex items-start" v-if="message.type === 'ai'">
            <img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png" alt="AI Logo" class="w-8 h-8 rounded-full mr-2">
            <div class="text-gray-700 p-2 rounded-lg w-full text-sm">
              {{ message.text }}
            </div>
          </div>
          <div class="text-gray-700 p-2 rounded-lg w-full text-sm" v-else>
            {{ message.text }}
          </div>
        </div>
      </div>
    </main>
    <div class="w-full flex flex-col items-center p-4">
      <div class="input-container flex mb-2">
        <textarea id="messageInput" placeholder="Message DeepSeek-r1" class="flex-grow p-2 border border-gray-300 rounded-l text-black text-sm resize-none overflow-y-auto" rows="1" v-model="newMessage" @keydown.ctrl.enter="sendMessage" :disabled="isGenerating"></textarea>
        <button @click="sendMessage" class="bg-blue-500 text-white px-4 py-2 rounded-r" :disabled="isGenerating">Send</button>
      </div>
      <p class="text-gray-500 text-sm">Создано с любовью к технологиям и инновациям.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showTitle: true,
      newMessage: '',
      messages: [],
      chatHistory: [], 
      isGenerating: false 
    };
  },
  methods: {
    async sendMessage() {
      if (this.newMessage.trim() !== '') {
        this.isGenerating = true;

        this.messages.push({ type: 'user', text: this.newMessage });
        this.chatHistory.push({ role: 'user', content: this.newMessage });

        const response = await this.sendToApi(this.chatHistory);
        
        if (response) {
          this.messages.push({ type: 'ai', text: '' });
          this.chatHistory.push({ role: 'assistant', content: '' });
          
          this.processStreamedResponse(response);
        } else {
          this.messages.push({ type: 'ai', text: 'Ошибка при получении ответа от API.' });
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
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application  /json'
          },
          body: JSON.stringify({
            model: 'deepseek-r1:14b',
            messages: history
          })
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

    processStreamedResponse(stream) {
      const reader = stream.getReader();
      let messageContent = '';
      const lastMessageIndex = this.messages.length - 1;

      const readStream = async () => {
        const { done, value } = await reader.read();
        if (done) {
          const lastMessage = this.messages[lastMessageIndex];
          if (lastMessage && lastMessage.type === 'ai') {
            lastMessage.text = messageContent; 
          }
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
              messageContent += content; 

              const lastMessage = this.messages[lastMessageIndex];
              if (lastMessage && lastMessage.type === 'ai') {
                lastMessage.text += content; 
              }
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }

        readStream();
      };

      readStream();
    },

    clearChat() {
      this.messages = [];
      this.chatHistory = [];
      this.showTitle = true; 
    },

    messageClass(type) {
      return type === 'ai' ? 'flex justify-start mb-2' : 'flex justify-end mb-2';
    }
  }
};
</script>