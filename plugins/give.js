import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser, getUserFromMessage } from '../lib/utils.js';

const giveCommand = {
  name: "give",
  category: "rpg",
  description: "Transfiere monedas a otro usuario.",
  aliases: ["dar", "transferir"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const amountStr = args[0];
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, especifica una cantidad válida de monedas para dar.\nEjemplo: `.give 100 @usuario`" }, { quoted: msg });
    }

    const targetId = getUserFromMessage(msg, args.slice(1));
    if (!targetId || !usersDb[targetId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario válido del grupo." }, { quoted: msg });
    }

    if (targetId === senderId) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No puedes darte monedas a ti mismo." }, { quoted: msg });
    }

    if ((user.coins || 0) < amount) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes suficientes monedas para dar esa cantidad." }, { quoted: msg });
    }

    const targetUser = usersDb[targetId];
    initializeRpgUser(targetUser);

    user.coins -= amount;
    targetUser.coins = (targetUser.coins || 0) + amount;

    writeUsersDb(usersDb);

    const successMessage = `*💸 Transferencia Exitosa 💸*\n\nHas transferido *${amount}* monedas a @${targetId.split('@')[0]}.`;
    await sock.sendMessage(msg.key.remoteJid, {
        text: successMessage,
        mentions: [targetId]
    }, { quoted: msg });
  }
};

export default giveCommand;