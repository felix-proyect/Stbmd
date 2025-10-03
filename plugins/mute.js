import { readSettingsDb, writeSettingsDb } from '../lib/database.js';
import { getUserFromMessage } from '../lib/utils.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

const muteCommand = {
  name: "mute",
  category: "grupos",
  description: "Silencia a un usuario en el grupo, eliminando sus mensajes.",
  group: true,
  admin: true,

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const userToMute = getUserFromMessage(msg, args);

    if (!userToMute) {
      return sock.sendMessage(from, { text: "Debes mencionar a un usuario o responder a su mensaje para silenciarlo." }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(from);

      // Check if the target user is an admin
      const targetIsAdmin = metadata.participants.some(p => areJidsSameUser(p.id, userToMute) && p.admin);
      if (targetIsAdmin) {
        return sock.sendMessage(from, { text: "No se puede silenciar a un administrador del grupo." }, { quoted: msg });
      }

      const settings = readSettingsDb();
      if (!settings[from]) {
        settings[from] = {};
      }
      if (!settings[from].mutedUsers) {
        settings[from].mutedUsers = [];
      }

      // Check if user is already muted
      if (settings[from].mutedUsers.includes(userToMute)) {
        return sock.sendMessage(from, { text: "Este usuario ya está silenciado." }, { quoted: msg });
      }

      settings[from].mutedUsers.push(userToMute);
      writeSettingsDb(settings);

      await sock.sendMessage(from, { text: `✅ @${userToMute.split('@')[0]} ha sido silenciado. Sus mensajes serán eliminados.`, mentions: [userToMute] }, { quoted: msg });

    } catch (error) {
      console.error("Error in mute command:", error);
      await sock.sendMessage(from, { text: "❌ Ocurrió un error al intentar silenciar al usuario." }, { quoted: msg });
    }
  }
};

export default muteCommand;