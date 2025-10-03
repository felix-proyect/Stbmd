import { readSettingsDb, writeSettingsDb } from '../lib/database.js';
import { getUserFromMessage } from '../lib/utils.js';

const unmuteCommand = {
  name: "unmute",
  category: "grupos",
  description: "Permite que un usuario silenciado vuelva a enviar mensajes.",
  group: true,
  admin: true,

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const userToUnmute = getUserFromMessage(msg, args);

    if (!userToUnmute) {
      return sock.sendMessage(from, { text: "Debes mencionar a un usuario o responder a su mensaje para quitarle el silencio." }, { quoted: msg });
    }

    try {
      const settings = readSettingsDb();
      const groupSettings = settings[from];

      if (!groupSettings || !groupSettings.mutedUsers || !groupSettings.mutedUsers.includes(userToUnmute)) {
        return sock.sendMessage(from, { text: "Este usuario no está silenciado." }, { quoted: msg });
      }

      // Remove the user from the muted list
      settings[from].mutedUsers = settings[from].mutedUsers.filter(jid => jid !== userToUnmute);
      writeSettingsDb(settings);

      await sock.sendMessage(from, { text: `✅ @${userToUnmute.split('@')[0]} ya no está silenciado.`, mentions: [userToUnmute] }, { quoted: msg });

    } catch (error) {
      console.error("Error in unmute command:", error);
      await sock.sendMessage(from, { text: "❌ Ocurrió un error al intentar quitar el silencio al usuario." }, { quoted: msg });
    }
  }
};

export default unmuteCommand;