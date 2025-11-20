/**
 * api.js
 * Простой сервер для отправки графика криптовалюты в ChatGPT и получения анализа/идей сделок.
 *
 * Установка:
 * 1) npm init -y
 * 2) npm i express multer node-fetch dotenv
 * 3) Добавьте .env с OPENAI_API_KEY=<ваш_ключ>
 *
 * Использование:
 * POST /analyze
 * - multipart/form-data: поле "chart" - файл изображения (png/jpg)
 * - OR application/json: { "imageUrl": "https://...", "symbol":"BTC/USDT", "tf":"1h" }
 * - OR application/json: { "ohlc": [{ "t":163..., "o":..., "h":..., "l":..., "c":..., "v":... }, ...], "symbol":"BTC/USDT", "tf":"1h" }
 *
 * Ответ: JSON с ответом ассистента в поле "analysis".
 *
 * ВАЖНО: это не финансовый совет. Модель может ошибаться. Тестируйте на демо/фейковых данных.
 */

import express from "express";
import multer from "multer";
import fs from "fs/promises";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("ERROR: set OPENAI_API_KEY in .env");
  process.exit(1);
}

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(express.json({ limit: "10mb" }));

/**
 * Utility: convert local file to data URL (base64)
 */
async function fileToDataURL(path, mimeType = "image/png") {
  const data = await fs.readFile(path);
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

/**
 * Build prompt for assistant.
 * If ohlc provided, include a summarized table; if image provided, attach note to look at image.
 */
function buildPrompt({ imageDataUrl, imageUrl, ohlc, symbol = "UNKNOWN", timeframe = "UNKNOWN" }) {
  const header = `You are a helpful trading assistant. Analyze the provided chart/data for ${symbol} on timeframe ${timeframe}.\n` +
    `Give concise, actionable trade ideas (entry, stop-loss, take-profit), position sizing guidance as percentage of portfolio, and rationale.\n` +
    `Also provide uncertainties and list conditions that would invalidate each idea.\n` +
    `**Important**: clearly mark "NOT FINANCIAL ADVICE" and show confidence level (low/medium/high) for each idea.\n\n`;

  let body = "";

  if (ohlc) {
    // include a brief OHLC summary: last 5 candles
    const last = ohlc.slice(-5);
    body += "OHLC (last 5 candles):\n";
    body += last.map(c => `t:${new Date(c.t).toISOString()} o:${c.o} h:${c.h} l:${c.l} c:${c.c} v:${c.v}`).join("\n");
    body += "\n\nPlease analyze technical patterns (support/resistance, trend, momentum) and give trade ideas.\n\n";
  }

  if (imageUrl) {
    body += `Image URL: ${imageUrl}\nPlease analyze the chart image. Describe detected patterns, trendlines, support/resistance, indicators visible, and give trade ideas.\n\n`;
  } else if (imageDataUrl) {
    body += `Image: (data URL attached) — the assistant should analyze the image content. If the system cannot parse data URL, ask for a public URL.\n\n`;
    // we put the data URL after the plain-text prompt to make
