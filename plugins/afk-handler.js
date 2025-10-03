import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

// Helper function to format AFK duration
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

  return duration.trim();
}

const afkHandler = {
  name: "afk-handler",
  isAutoHandler: true,

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;
    if (!senderId) return;

    const users = readUsersDb();
    let dbNeedsUpdate = false;

    // 1. Check if the sender is returning from AFK
    if (users[senderId]?.afk) {
      const afkInfo = users[senderId].afk;
      const afkDuration = Date.now() - afkInfo.time;
      const durationStr = formatAfkDuration(afkDuration);

      const welcomeBackMsg = `👋 @${senderId.split('@')[0]} ha vuelto.\nEstuvo AFK por ${durationStr}.`;
      await sock.sendMessage(from, { text: welcomeBackMsg, mentions: [senderId] }, { quoted: msg });

      delete users[senderId].afk;
      dbNeedsUpdate = true;
    }

    // 2. Check if any mentioned users are AFK
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length > 0) {
      for (const jid of mentionedJids) {
        if (users[jid]?.afk) {
          const afkInfo = users[jid].afk;
          const afkDuration = Date.now() - afkInfo.time;
          const durationStr = formatAfkDuration(afkDuration);

          const afkNoticeMsg = `😴 El usuario @${jid.split('@')[0]} está AFK.\nMotivo: ${afkInfo.reason}\nDesde hace: ${durationStr}`;
          await sock.sendMessage(from, { text: afkNoticeMsg, mentions: [jid] }, { quoted: msg });
        }
      }
    }

    if (dbNeedsUpdate) {
      writeUsersDb(users);
    }
  }
};

export default afkHandler;