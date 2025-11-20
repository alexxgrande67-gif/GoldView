// Telegram бот для Mini App
// Файл: api/bot.js

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.MINI_APP_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'OK' });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
      await sendMessage(chatId, 
        '👋 Привет! Я анализирую графики криптовалют.\n\n📊 Нажми кнопку ниже:',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '📈 Анализировать график', web_app: { url: APP_URL } }
            ]]
          }
        }
      );
    } else if (text === '/help') {
      await sendMessage(chatId,
        '📚 Как использовать:\n\n' +
        '1. Нажми "Анализировать график"\n' +
        '2. Загрузи скриншот\n' +
        '3. Получи анализ\n\n' +
        '⚠️ Это не финансовый совет!'
      );
    } else if (message.photo) {
      await sendMessage(chatId,
        'Используй кнопку для анализа:',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '📈 Открыть анализатор', web_app: { url: APP_URL } }
            ]]
          }
        }
      );
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ ok: true });
  }
}

async function sendMessage(chatId, text, options = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...options })
  });
}
