import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser, getUserFromMessage } from '../lib/utils.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

const tradeWaifuCommand = {
  name: "tradewaifu",
  category: "gacha",
  description: "Propón un intercambio de waifus a otro usuario.\nUso: .tradewaifu <ID de tu waifu> @usuario <ID de su waifu>",
  aliases: ["intercambiarwaifu"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG." }, { quoted: msg });
    }
    initializeRpgUser(user);

    if (args.length < 3) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Formato incorrecto. Uso: `.tradewaifu <ID_tuya> @usuario <ID_suya>`" }, { quoted: msg });
    }

    const myWaifuId = args[0];
    const targetId = getUserFromMessage(msg, args.slice(1));
    const targetWaifuId = args.slice(-1)[0];

    if (!targetId || !usersDb[targetId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario válido para el intercambio." }, { quoted: msg });
    }
    if (targetId === senderId) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No puedes intercambiar contigo mismo." }, { quoted: msg });
    }

    const myWaifu = user.harem.find(w => w.id === myWaifuId);
    if (!myWaifu) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes ninguna waifu con el ID \`${myWaifuId}\`.` }, { quoted: msg });
    }

    const targetUser = usersDb[targetId];
    initializeRpgUser(targetUser);
    const targetWaifu = targetUser.harem.find(w => w.id === targetWaifuId);
    if (!targetWaifu) {
      return sock.sendMessage(msg.key.remoteJid, { text: `El otro jugador no tiene una waifu con el ID \`${targetWaifuId}\`.` }, { quoted: msg });
    }

    const tradeId = uuidv4().slice(0, 6);
    const trades = readTradesDb();

    const newTrade = {
        id: tradeId,
        from: senderId,
        to: targetId,
        fromWaifu: myWaifu,
        toWaifu: targetWaifu,
        createdAt: Date.now()
    };
    trades.push(newTrade);
    writeTradesDb(trades);

    const proposalMessage = `*📬 Nueva Propuesta de Intercambio 📬*\n\n` +
                            `@${senderId.split('@')[0]} quiere intercambiar su waifu:\n` +
                            `> *${myWaifu.name}* (ID: \`${myWaifu.id}\`)\n\n` +
                            `Por tu waifu:\n` +
                            `> *${targetWaifu.name}* (ID: \`${targetWaifu.id}\`)\n\n` +
                            `Para aceptar, usa el comando:\n` +
                            `\`.accepttrade ${tradeId}\`\n\n` +
                            `Para rechazar:\n` +
                            `\`.rejecttrade ${tradeId}\`\n\n` +
                            `_Esta propuesta expira en 5 minutos._`;

    await sock.sendMessage(msg.key.remoteJid, {
        text: proposalMessage,
        mentions: [senderId, targetId]
    });
  }
};

export default tradeWaifuCommand;