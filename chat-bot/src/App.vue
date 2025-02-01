<template>
  <div class="min-h-screen p-1 flex flex-col" style="background: linear-gradient(to bottom right, #FFFFFF, #BBBBBB)">
    <div class="relative">
      <p class="mt-4 text-3xl font-bold text-center text-gray-800">Чат с нейросетью</p>
    </div>

    <div class="flex items-start justify-center">
      <div class="rounded w-1/2 mt-4 max-h-[80vh] overflow-y-auto">
        <ul class="list-none p-0">
          <li v-for="(msg, index) in messages" :key="index" class="py-2 relative border-b-2 border-gray-800">
            <span class="text-[20px] text-gray-800">
              <strong>{{ msg.substring(0, 3) }}</strong>{{ msg.substring(3) }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4 w-[70%]">
      <div class="relative rounded-lg bg-transparent">
        <textarea
          placeholder="Введите запрос: ..."
          v-model="inputValue"
          class="border border-black border-opacity-25 w-full h-full pl-4 pr-16 pt-4 pb-4 rounded-lg bg-transparent text-base font-bold text-gray-800 text-opacity-75 resize-none"
          rows="3"
          @keydown.enter.prevent="handleSubmit"
        />
        <button type="submit" class="w-12 h-12 absolute bg-gray-300 rounded-2xl right-4 top-2.5">
          <img src="/enter-svgrepo-com.svg" height="52" width="45" />
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const messages = ref([]);
    const inputValue = ref("");
    const isGeneratingResponse = ref(false);

    const handleSubmit = async () => {
      if (inputValue.value.trim() && !isGeneratingResponse.value) {
        addMessageToHistory(inputValue.value, 'user');
        await generateResponse(inputValue.value);
        inputValue.value = "";
      }
    };

    const addMessageToHistory = (message, type) => {
      messages.value = [...messages.value, `${type === 'user' ? 'Вы' : 'AI'}: ${message}`];
    };

    const generateResponse = async (userInput) => {
      const prompt = [...messages.value, `Вы: ${userInput}`].join('\n');

      try {
        isGeneratingResponse.value = true;
        const response = await fetch('http://95.28.220.36:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'wizard-math:13b',
            prompt: prompt,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const readStream = async () => {
          const { done, value } = await reader.read();
          if (done) {
            isGeneratingResponse.value = false;
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
          readStream();
        };

        readStream();
      } catch (error) {
        console.error('Ошибка:', error);
        addMessageToHistory(`Ошибка: ${error.message}`, 'bot');
        isGeneratingResponse.value = false;
      }
    };

    return {
      messages,
      inputValue,
      handleSubmit,
    };
  }
};
</script>


<style scoped>
/* Основные стили для чата */
.min-h-screen {
  min-height: 100vh;
}

.p-1 {
  padding: 0.25rem;
}

.mt-4 {
  margin-top: 1rem;
}

.text-3xl {
  font-size: 1.875rem;
}

.font-bold {
  font-weight: 700;
}

.text-center {
  text-align: center;
}

.text-gray-800 {
  color: #2d3748;
}

.rounded {
  border-radius: 0.5rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.border-b-2 {
  border-bottom-width: 2px;
}

.border-gray-800 {
  border-color: #2d3748;
}

.bg-transparent {
  background-color: transparent;
}

.border {
  border-width: 1px;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.pl-4 {
  padding-left: 1rem;
}

.pr-16 {
  padding-right: 4rem;
}

.pt-4 {
  padding-top: 1rem;
}

.pb-4 {
  padding-bottom: 1rem;
}

.resize-none {
  resize: none;
}

.absolute {
  position: absolute;
}

.bottom-0 {
  bottom: 0;
}

.transform {
  transform: translateX(-50%);
}

.mb-4 {
  margin-bottom: 1rem;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}

.bg-gray-300 {
  background-color: #d1d5db;
}

.rounded-2xl {
  border-radius: 1rem;
}

.right-4 {
  right: 1rem;
}

</style>