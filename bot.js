import mineflayer from 'mineflayer';
const FlayerCaptcha = require('FlayerCaptcha');
const fs = require('fs');
const path = require('path');
import express from 'express';
import axios from 'axios';


// Фильтрация нежелательных ошибок
const originalStderrWrite = process.stderr.write;
process.stderr.write = function(message, ...args) {
  if (!message.includes('Ignoring block entities as chunk failed to load')) {
    originalStderrWrite.apply(process, [message, ...args]);
  }
};

await axios.post('https://minecraft-twink-launcher.onrender.com/receive', { image: imageBuffer.toString('base64') });

const app = express();
const port = process.env.PORT || 3000;
const CLIENT_URL = 'https://minecraft-twink-launcher.onrender.com/receive'; // http://localhost:4000

app.use(express.json());

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      fs.unlinkSync(curPath);
    });
    fs.rmdirSync(folderPath);
  }
}

async function sendImage(imagePath) {
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    try {
      await axios.post('https://minecraft-twink-launcher.onrender.com/receive', { image: imageBuffer.toString('base64') });
      console.log('Изображение успешно отправлено');
    } catch (error) {
      console.error('Ошибка отправки изображения:', error.message);
    }
  }
}

let bot = null;
let resourcesAccepted = false; // Флаг принятия ресурсов
let commandSent = false; // Флаг отправки команды

app.post('/command', async (req, res) => {
  const { command } = req.body;

  if (command === '/start') {
    if (bot) {
      return res.json({ message: 'Бот уже запущен' });
    }

    console.log('Запуск бота...');
    bot = mineflayer.createBot({
      host: 'mc.angelmine.ru',
      username: 'named123',
      version: '1.16.5'
    });

    const captcha = new FlayerCaptcha(bot);
    let captchaCounter = 1;

    function getNextCaptchaNumber() {
      while (fs.existsSync(`captchas/${captchaCounter}.png`)) {
        captchaCounter++;
      }
      return captchaCounter++;
    }

    console.log('Удаление папки captchas...');
    deleteFolder('captchas');
    console.log('Создание новой папки captchas...');
    fs.mkdirSync('captchas');

    captcha.on('success', async (image) => {
      const captchaNumber = getNextCaptchaNumber();
      const filename = `captchas/${captchaNumber}.png`;
      await image.toFile(filename);
      console.log(`Captcha saved as ${filename}`);

      if (captchaNumber === 3) {
        console.log('Отправка 3.png на клиент...');
        sendImage(filename);
      }
    });

    bot.on('message', (message) => {
      //console.log(`Сообщение от сервера: ${message.toAnsi()}`);

      if (message.toString().includes('[ТекстурПак] Примите установку Aресурсов для комфортной игры!')) {
        console.log('Обнаружено сообщение о текстурпаке, принимаем ресурсы...');

        bot.once('resourcePack', (resourcePack) => {
          console.log(`Принимаем ресурсы: ${resourcePack.url}`);
          bot.acceptResourcePack();
          resourcesAccepted = true;
        });
      }
    });

    bot.on('physicTick', () => {
      if (resourcesAccepted && !commandSent) {
        if (bot.entity.position.x === 0.5 && bot.entity.position.y === 90 && bot.entity.position.z === 0.5) {
          console.log('Бот принял ресурсы и находится в точке (0.5, 90, 0.5), отправляем команду...');
          bot.chat('/gr1');
          commandSent = true; // Устанавливаем флаг, чтобы команда выполнялась только один раз
        }
      }
    });

    res.json({ message: 'Бот успешно запущен' });

  } else if (command.startsWith('/m ')) {
    if (bot) {
      const messageText = command.substring(3);
      bot.chat(messageText);
      res.json({ message: `Бот отправил сообщение: ${messageText}` });
    } else {
      res.status(500).json({ message: 'Ошибка: бот не запущен' });
    }
  } else {
    res.status(400).json({ message: 'Неверная команда' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
