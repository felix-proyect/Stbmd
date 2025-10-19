import { readUsersDb, writeUsersDb } from '../lib/database.js';

// 🩵 Función auxiliar: Formato de duración AFK (ahora con decoración temática)
function formatAfkDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  let duration = '';
  if (days > 0) duration += `${days}d `;
  if (hours > 0) duration += `${hours}h `;
  if (minutes > 0) duration += `${minutes}m `;
  if (seconds > 0) duration += `${seconds}s`;

  return duration.trim() || 'unos segundos 🕐';
}

// 🌊 Plugin AFK con estética Gawr Gura 🦈
const afkPlugin = {
  name: "afk",
  category: "util",
  description: "Establece tu estado como AFK con estilo Gawr Gura y notifica a quienes te mencionen.",
  isAutoHandler: true,

  async execute({ sock, msg, args, body }) {
    if (args) {
      return this.command({ sock, msg, args });
    } else {
      return this.handler({ sock, msg, body });
    }
  },

  // 💬 Comando para establecer AFK
  async command({ sock, msg, args }) {
    const userId = msg.sender;
    const reason = args.join(' ').trim() || '🌊 Solo nadando un rato~';
    const afkTime = Date.now();

    try {
      const users = readUsersDb();
      if (!users[userId]) users[userId] = {};
      users[userId].afk = { time: afkTime, reason };
      writeUsersDb(users);

      const message = `
🦈 *Gura Mode: AFK Activado!* 🌊
──────────────────────
👤 Usuario: @${userId.split('@')[0]}
💤 Estado: *AFK*
📖 Motivo: ${reason}
──────────────────────
*Bloop~* No te preocupes, volverás pronto~ 🩵
`;
      await sock.sendMessage(msg.key.remoteJid, { text: message.trim(), mentions: [userId] }, { quoted: msg });
    } catch (error) {
      console.error("Error en comando AFK:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error estableciendo tu modo AFK. 🦈" }, { quoted: msg });
    }
  },

  // 🔔 Handler que avisa cuando alguien está AFK o regresa
  async handler({ sock, msg }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;
    if (!senderId) return;

    const users = readUsersDb();
    let dbNeedsUpdate = false;

    // 🏖️ Si el usuario regresa del AFK
    if (users[senderId]?.afk) {
      const afkInfo = users[senderId].afk;
      const durationStr = formatAfkDuration(Date.now() - afkInfo.time);

      const welcomeBackMsg = `
🌊 *¡Gura detecta movimiento!* 🦈
──────────────────────
👋 @${senderId.split('@')[0]} ha vuelto de las profundidades~
⏱️ Estuvo AFK por *${durationStr}*
──────────────────────
¡Bienvenido de vuelta al océano digital~ 🩵
`;
      await sock.sendMessage(from, { text: welcomeBackMsg.trim(), mentions: [senderId] }, { quoted: msg });

      delete users[senderId].afk;
      dbNeedsUpdate = true;
    }

    // 🪸 Si alguien menciona a un usuario AFK
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentionedJids) {
      if (users[jid]?.afk) {
        const afkInfo = users[jid].afk;
        const durationStr = formatAfkDuration(Date.now() - afkInfo.time);

        const afkNoticeMsg = `
💤 *Usuario en modo Gura AFK* 🦈
──────────────────────
👤 @${jid.split('@')[0]}
📖 Motivo: ${afkInfo.reason}
⏱️ Hace: *${durationStr}*
──────────────────────
*Shh~* Está descansando en el fondo del mar 🌊
`;
        await sock.sendMessage(from, { text: afkNoticeMsg.trim(), mentions: [jid] }, { quoted: msg });
      }
    }

    if (dbNeedsUpdate) writeUsersDb(users);
  }
};

export default afkPlugin;
