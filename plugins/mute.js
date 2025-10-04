import { readSettingsDb, writeSettingsDb } from '../lib/database.js';
import { getUserFromMessage } from '../lib/utils.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

const mutePlugin = {
  name: "mute",
  category: "grupos",
  description: "Silencia a un usuario en el grupo, eliminando sus mensajes.",
  group: true,
  admin: true,
  isAutoHandler: true, // Mark as a dual-purpose plugin

  async execute({ sock, msg, args, body }) {
    // If 'args' is defined, it's a command call. Otherwise, it's an auto-handler call.
    if (args) {
      return this.command({ sock, msg, args });
    } else {
      return this.handler({ sock, msg, body });
    }
  },

  // The command to mute a user
  async command({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const userToMute = getUserFromMessage(msg, args);

    if (!userToMute) {
      return sock.sendMessage(from, { text: "Debes mencionar a un usuario o responder a su mensaje para silenciarlo." }, { quoted: msg });
    }

    let metadata;
    try {
        metadata = await sock.groupMetadata(from);
    } catch (e) {
        console.error("Error getting group metadata in mute command:", e);
        return sock.sendMessage(from, { text: "❌ Ocurrió un error al obtener la información del grupo." }, { quoted: msg });
    }

    const targetIsAdmin = metadata.participants.some(p => areJidsSameUser(p.id, userToMute) && p.admin);
    if (targetIsAdmin) {
      return sock.sendMessage(from, { text: "No se puede silenciar a un administrador del grupo." }, { quoted: msg });
    }

    const settings = readSettingsDb();
    if (!settings[from]) settings[from] = {};
    if (!settings[from].mutedUsers) settings[from].mutedUsers = [];

    if (settings[from].mutedUsers.some(jid => areJidsSameUser(jid, userToMute))) {
      return sock.sendMessage(from, { text: "Este usuario ya está silenciado." }, { quoted: msg });
    }

    settings[from].mutedUsers.push(userToMute);
    writeSettingsDb(settings);

    await sock.sendMessage(from, { text: `✅ @${userToMute.split('@')[0]} ha sido silenciado. Sus mensajes serán eliminados.`, mentions: [userToMute] }, { quoted: msg });
  },

  // The handler to delete messages from muted users
  async handler({ sock, msg }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;

    if (!from.endsWith('@g.us') || !senderId) return;

    try {
      const settings = readSettingsDb();
      const mutedUsers = settings[from]?.mutedUsers;

      if (!mutedUsers || mutedUsers.length === 0) return;

      const isMuted = mutedUsers.some(mutedJid => areJidsSameUser(mutedJid, senderId));

      if (isMuted) {
        const metadata = await sock.groupMetadata(from);
        const senderIsAdmin = metadata.participants.some(p => areJidsSameUser(p.id, senderId) && p.admin);

        if (senderIsAdmin) return; // Safeguard: don't delete messages from admins.

        await sock.sendMessage(from, { delete: msg.key });
      }
    } catch (error) {
      console.error("Error in mute-handler logic:", error);
    }
  }
};

export default mutePlugin;