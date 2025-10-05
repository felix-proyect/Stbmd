import fs from 'fs';
import { initializeRpgUser } from '../lib/utils.js';

const TRADES_FILE_PATH = './database/gacha_trades.json';

const readTradesDb = () => {
    try {
        if (!fs.existsSync(TRADES_FILE_PATH)) return [];
        const data = fs.readFileSync(TRADES_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const tradesCommand = {
  name: "trades",
  category: "gacha",
  description: "Muestra tus propuestas de intercambio pendientes (enviadas y recibidas).",
  aliases: ["intercambios"],
  group: true,

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    let trades = readTradesDb();

    // Eliminar propuestas expiradas (más de 5 minutos)
    const now = Date.now();
    const tradeExpiryMs = 5 * 60 * 1000;
    trades = trades.filter(t => (now - t.createdAt) < tradeExpiryMs);

    const myTrades = trades.filter(t => t.from === senderId || t.to === senderId);

    if (myTrades.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ninguna propuesta de intercambio activa en este momento." }, { quoted: msg });
    }

    let tradesMessage = `*📬 Tus Intercambios Pendientes 📬*\n\n`;

    const sentTrades = myTrades.filter(t => t.from === senderId);
    const receivedTrades = myTrades.filter(t => t.to === senderId);

    if (sentTrades.length > 0) {
        tradesMessage += "*Enviados por ti:*\n";
        sentTrades.forEach(trade => {
            tradesMessage += `> ↔️ ID: \`${trade.id}\`\n` +
                             `  - Ofreces: *${trade.fromWaifu.name}*\n` +
                             `  - Pides a @${trade.to.split('@')[0]}: *${trade.toWaifu.name}*\n\n`;
        });
    }

    if (receivedTrades.length > 0) {
        tradesMessage += "*Recibidos de otros:*\n";
        receivedTrades.forEach(trade => {
            tradesMessage += `> ↔️ ID: \`${trade.id}\`\n` +
                             `  - @${trade.from.split('@')[0]} te ofrece: *${trade.fromWaifu.name}*\n` +
                             `  - A cambio de tu: *${trade.toWaifu.name}*\n` +
                             `  - Para aceptar: \`.accepttrade ${trade.id}\`\n\n`;
        });
    }

    await sock.sendMessage(msg.key.remoteJid, { text: tradesMessage.trim() }, { quoted: msg });
  }
};

export default tradesCommand;