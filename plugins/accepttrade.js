import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';
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

const acceptTradeCommand = {
  name: "accepttrade",
  category: "rpg",
  description: "Acepta una propuesta de intercambio de waifus. Uso: .accepttrade <ID_del_trade>",
  aliases: ["aceptarintercambio"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const tradeId = args[0];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG." }, { quoted: msg });
    }
    initializeRpgUser(user);

    if (!tradeId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el ID del intercambio que quieres aceptar." }, { quoted: msg });
    }

    const trades = readTradesDb();
    const tradeIndex = trades.findIndex(t => t.id === tradeId);

    if (tradeIndex === -1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró ninguna propuesta de intercambio con ese ID." }, { quoted: msg });
    }

    const trade = trades[tradeIndex];

    if (trade.to !== senderId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No puedes aceptar un intercambio que no es para ti." }, { quoted: msg });
    }

    const tradeExpiryMs = 5 * 60 * 1000; // 5 minutos
    if (Date.now() - trade.createdAt > tradeExpiryMs) {
      trades.splice(tradeIndex, 1);
      writeTradesDb(trades);
      return sock.sendMessage(msg.key.remoteJid, { text: "Esta propuesta de intercambio ya ha expirado." }, { quoted: msg });
    }

    const fromUser = usersDb[trade.from];
    const toUser = usersDb[trade.to];
    initializeRpgUser(fromUser);
    initializeRpgUser(toUser);

    const fromWaifuIndex = fromUser.harem.findIndex(w => w.id === trade.fromWaifu.id);
    const toWaifuIndex = toUser.harem.findIndex(w => w.id === trade.toWaifu.id);

    if (fromWaifuIndex === -1 || toWaifuIndex === -1) {
      trades.splice(tradeIndex, 1);
      writeTradesDb(trades);
      return sock.sendMessage(msg.key.remoteJid, { text: "El intercambio no se puede completar porque uno de los jugadores ya no posee la waifu ofrecida." }, { quoted: msg });
    }

    // Realizar el intercambio
    const [fromWaifu] = fromUser.harem.splice(fromWaifuIndex, 1);
    const [toWaifu] = toUser.harem.splice(toWaifuIndex, 1);

    fromUser.harem.push(toWaifu);
    toUser.harem.push(fromWaifu);

    // Eliminar la propuesta de la base de datos
    trades.splice(tradeIndex, 1);

    writeUsersDb(usersDb);
    writeTradesDb(trades);

    const successMessage = `*🔄 ¡Intercambio Completado! 🔄*\n\n` +
                           `@${fromUser.id.split('@')[0]} ha recibido a *${toWaifu.name}*.\n` +
                           `@${toUser.id.split('@')[0]} ha recibido a *${fromWaifu.name}*.`;

    await sock.sendMessage(msg.key.remoteJid, { text: successMessage, mentions: [trade.from, trade.to] });
  }
};

export default acceptTradeCommand;