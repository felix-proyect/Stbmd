import { readUsersDb, writeUsersDb } from '../lib/database.js';

// --- Helper function (moved from handler) ---
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

  return duration.trim() || 'un momento';
}

const afkPlugin = {
  name: "afk",
  category: "util",
  description: "Establece tu estado como AFK y notifica a quienes te mencionen.",
  isAutoHandler: true, // Mark as a dual-purpose plugin

  async execute({ sock, msg, args, body }) {
    // If 'args' is defined, it's a command call. Otherwise, it's an auto-handler call.
    if (args) {
      return this.command({ sock, msg, args });
    } else {
      return this.handler({ sock, msg, body });
    }
  },

  // The command to set AFK status
  async command({ sock, msg, args }) {
    const userId = msg.sender;
    const reason = args.join(' ').trim() || 'Sin motivo';
    const afkTime = Date.now();

    try {
      const users = readUsersDb();
      if (!users[userId]) {
        users[userId] = {};
      }
      users[userId].afk = { time: afkTime, reason: reason };
      writeUsersDb(users);

      const message = `✅ @${userId.split('@')[0]} ahora está AFK.\nMotivo: ${reason}`;
      await sock.sendMessage(msg.key.remoteJid, { text: message, mentions: [userId] }, { quoted: msg });
    } catch (error) {
      console.error("Error in afk command:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al establecer tu estado AFK." }, { quoted: msg });
    }
  },

  // The handler to check for AFK users
  async handler({ sock, msg }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;
    if (!senderId) return;

    const users = readUsersDb();
    let dbNeedsUpdate = false;

    // 1. Check if the sender is returning from AFK
    if (users[senderId]?.afk) {
      const afkInfo = users[senderId].afk;
      const durationStr = formatAfkDuration(Date.now() - afkInfo.time);

      const welcomeBackMsg = `👋 @${senderId.split('@')[0]} ha vuelto.\nEstuvo AFK por ${durationStr}.`;
      await sock.sendMessage(from, { text: welcomeBackMsg, mentions: [senderId] }, { quoted: msg });

      delete users[senderId].afk;
      dbNeedsUpdate = true;
    }

    // 2. Check if any mentioned users are AFK
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentionedJids) {
      if (users[jid]?.afk) {
        const afkInfo = users[jid].afk;
        const durationStr = formatAfkDuration(Date.now() - afkInfo.time);
        const afkNoticeMsg = `😴 El usuario @${jid.split('@')[0]} está AFK.\nMotivo: ${afkInfo.reason}\nDesde hace: ${durationStr}`;
        await sock.sendMessage(from, { text: afkNoticeMsg, mentions: [jid] }, { quoted: msg });
      }
    }

    if (dbNeedsUpdate) {
      writeUsersDb(users);
    }
  }
};

export default afkPlugin;