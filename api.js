// API для анализа графиков криптовалют через OpenAI ChatGPT
// Работает на Vercel/Netlify Functions

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const analysisPrompt = `
Проанализируй этот график криптовалюты как профессиональный трейдер.

Предоставь ответ СТРОГО в формате JSON без дополнительного текста:

{
  "trend": "bullish/bearish/sideways",
  "trendDescription": "краткое описание тренда",
  "supportLevels": ["уровень1", "уровень2"],
  "resistanceLevels": ["уровень1", "уровень2"],
  "patterns": ["паттерн1", "паттерн2"],
  "entryPoints": {
    "long": {
      "price": "диапазон цен",
      "condition": "условие для входа"
    },
    "short": {
      "price": "диапазон цен",
      "condition": "условие для входа"
    }
  },
  "stopLoss": {
    "long": "уровень",
    "short": "уровень"
  },
  "takeProfit": [
    "TP1: цена (процент)",
    "TP2: цена (процент)",
    "TP3: цена (процент)"
  ],
  "risks": "описание рисков",
  "confidence": "high/medium/low"
}

Если цены не видны на графике, укажи это.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Можно заменить на gpt-4o или gpt-4
        messages: [
          {
            role: 'user',
            content: `Вот график в Base64: ${image}\n\n${analysisPrompt}`
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Analysis failed' });
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Пытаемся распарсить JSON из текста
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(200).json({
        trend: 'unknown',
        trendDescription: analysisText,
        entryPoints: { long: {}, short: {} },
        stopLoss: {},
        takeProfit: [],
        risks: 'Не удалось полностью проанализировать график'
      });
    }

    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

