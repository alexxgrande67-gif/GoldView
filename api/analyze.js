// API для анализа графиков через Google Gemini
// Файл: api/analyze.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image required' });
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not set' });
    
    // Вызов Gemini API
    const response = await fetch(
      `https://gemini.google.com/app?hl=ru`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Проанализируй этот график криптовалюты как профессиональный трейдер.

Предоставь анализ в следующем формате:

📈 ТРЕНД
[Восходящий/Нисходящий/Боковой и почему]

💰 ЦЕНА
[Текущая цена или диапазон если виден]

🎯 ТОЧКИ ВХОДА
Long (покупка): [цена и условия]
Short (продажа): [цена и условия]

🛡️ STOP LOSS
Long SL: [уровень]
Short SL: [уровень]

🎁 TAKE PROFIT
TP1: [цена]
TP2: [цена]
TP3: [цена]

📊 УРОВНИ
Поддержка: [уровни]
Сопротивление: [уровни]

⚠️ РИСКИ
[Описание рисков]

Будь конкретным. Если цены не видны, укажи это.`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image
                }
              }
            ]
          }]
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini error:', error);
      return res.status(500).json({ error: 'Analysis failed' });
    }
    
    const data = await response.json();
    const analysis = data.candidates[0].content.parts[0].text;
    
    return res.status(200).json({ analysis });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
