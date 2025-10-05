import { readUsersDb, writeUsersDb } from '../lib/database.js';
import fs from 'fs';

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

const writeTradesDb = (data) => {
    fs.writeFileSync(TRADES_FILE_PATH, JSON.stringify(data, null, 2));
};

const rejectTradeCommand = {
  name: "rejecttrade",
  category: "rpg",
  description: "Rechaza una propuesta de intercambio de waifus. Uso: .rejecttrade <ID_del_trade>",
  aliases: ["rechazarintercambio"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const tradeId = args[0];

    if (!tradeId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el ID del intercambio que quieres rechazar." }, { quoted: msg });
    }

    const trades = readTradesDb();
    const tradeIndex = trades.findIndex(t => t.id === tradeId);

    if (tradeIndex === -1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró ninguna propuesta de intercambio con ese ID." }, { quoted: msg });
    }

    const trade = trades[tradeIndex];

    // Solo el destinatario o el que envió la propuesta pueden rechazarla
    if (trade.to !== senderId && trade.from !== senderId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No puedes rechazar un intercambio que no te concierne." }, { quoted: msg });
    }

    trades.splice(tradeIndex, 1);
    writeTradesDb(trades);

    const rejectionMessage = `*❌ Intercambio Rechazado ❌*\n\n` +
                             `La propuesta de intercambio (ID: \`${trade.id}\`) entre @${trade.from.split('@')[0]} y @${trade.to.split('@')[0]} ha sido cancelada.`;

    await sock.sendMessage(msg.key.remoteJid, { text: rejectionMessage, mentions: [trade.from, trade.to] });
  }
};

export default rejectTradeCommand;