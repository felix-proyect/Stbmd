import { readUsersDb, writeUsersDb } from '../lib/database.js';

const afkCommand = {
  name: "afk",
  category: "util",
  description: "Establece tu estado como AFK (Lejos del teclado).",

  async execute({ sock, msg, text }) {
    const userId = msg.sender;
    const reason = text.trim() || 'Sin motivo';
    const afkTime = Date.now();

    try {
      const users = readUsersDb();
      if (!users[userId]) {
        users[userId] = {};
      }

      users[userId].afk = {
        time: afkTime,
        reason: reason
      };

      writeUsersDb(users);

      const message = `✅ @${userId.split('@')[0]} ahora está AFK.\nMotivo: ${reason}`;
      await sock.sendMessage(msg.key.remoteJid, { text: message, mentions: [userId] }, { quoted: msg });

    } catch (error) {
      console.error("Error in afk command:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al establecer tu estado AFK." }, { quoted: msg });
    }
  }
};

export default afkCommand;