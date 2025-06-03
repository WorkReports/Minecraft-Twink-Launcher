import axios from 'axios';
import express from 'express';
import fs from 'fs';
import readline from 'readline';

const originalStderrWrite = process.stderr.write;
process.stderr.write = function(message, ...args) {
  if (!message.includes('Ignoring block entities as chunk failed to load')) {
    originalStderrWrite.apply(process, [message, ...args]);
  }
};

const SERVER_URL = 'https://minecraft-twink-launcher.onrender.com'; // Объявлено перед использованием

const app = express();
const port = 4000;

app.use(express.json());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function sendCommand(command) {
  axios.post(`${SERVER_URL}/command`, { command })
    .then(response => console.log('Ответ сервера:', response.data))
    .catch(error => console.error('Ошибка:', error.message));
}

function requestCommand() {
  rl.question('', (command) => {
    sendCommand(command);
    requestCommand();
  });
}

app.post('/receive', (req, res) => {
  if (req.body.image) {
    const imageBuffer = Buffer.from(req.body.image, 'base64');
    fs.writeFileSync('received_image.png', imageBuffer);
    console.log('Изображение 3.png получено и сохранено');
    res.json({ message: 'Изображение успешно сохранено' });
  } else {
    res.status(400).json({ message: 'Неверные данные' });
  }
});

app.listen(port, () => {
  console.log(`Клиент запущен на порту ${port}`);
  requestCommand();
});
