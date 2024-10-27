const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('.terminal-output');

// Массив для хранения истории сообщений
const messageHistory = [];
let isGeneratingResponse = false; // Флаг для отслеживания состояния запроса

// Функция для добавления сообщений в историю
function addMessageToHistory(message, type) {
  messageHistory.push({ message, type });
}

// Обработчик ввода пользователя
terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const userInput = terminalInput.value.trim();
    if (userInput !== '' && !isGeneratingResponse) { // Проверка состояния флага
      updateTerminalOutput(`Вы: ${userInput}`, 'user');
      processUserInput(userInput);
      terminalInput.value = '';
    }
  }
});

// Функция генерации ответа
async function generateResponse() {
  const prompt = messageHistory.map(msg => `${msg.type === 'user' ? 'Вы' : 'AI'}: ${msg.message}`).join('\n');
  
  try {
    isGeneratingResponse = true; // Установка флага в true
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
        isGeneratingResponse = false; // Установка флага в false при завершении
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      lines.forEach(line => {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              liveUpdateTerminalOutput(`AI: ${data.response}`);
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
    updateTerminalOutput(`Ошибка: ${error.message}`, 'bot');
    isGeneratingResponse = false; // Установка флага в false в случае ошибки
  }
}

// Обработка ввода пользователя
async function processUserInput(input) {
  addMessageToHistory(input, 'user');
  await generateResponse();
}

// Функция обновления вывода терминала
function updateTerminalOutput(output, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = type;
  messageDiv.innerHTML = output;

  terminalOutput.appendChild(messageDiv);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Функция для добавления нового элемента в терминал
function addNewMessageToTerminal(output, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = type;
  messageDiv.innerHTML = output;

  terminalOutput.appendChild(messageDiv);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Функция для обновления вывода терминала в реальном времени
function liveUpdateTerminalOutput(output) {
  const terminalBody = document.querySelector('.terminal-output');
  const lastMessage = terminalBody.lastChild;
  const cleanedOutput = output.replace(/AI: /g, '');

  if (lastMessage && lastMessage.className !== 'user') {
    lastMessage.innerHTML += cleanedOutput;
  } else {
    addNewMessageToTerminal(output, 'bot');
  }

  addMessageToHistory(cleanedOutput, 'bot');
}
