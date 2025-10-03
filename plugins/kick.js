import { getUserFromMessage } from '../lib/utils.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

const kickCommand = {
  name: "kick",
  category: "grupos",
  description: "Elimina a un miembro del grupo.",
  group: true,
  admin: true,
  botAdmin: false, // As requested, don't check if bot is admin

  async execute({ sock, msg, args }) {
    const userToKick = getUserFromMessage(msg, args);

    if (!userToKick) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario o responder a su mensaje para eliminarlo." }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(msg.key.remoteJid);
      const botJid = sock.user.id;

      // Check if trying to kick the bot
      if (areJidsSameUser(userToKick, botJid)) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No puedo eliminarme a mí mismo." }, { quoted: msg });
      }

      // Check if trying to kick the group owner
      if (metadata.owner && areJidsSameUser(userToKick, metadata.owner)) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se puede eliminar al propietario del grupo." }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(msg.key.remoteJid, [userToKick], "remove");
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Se ha eliminado a @${userToKick.split('@')[0]} del grupo.`, mentions: [userToKick] }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando kick:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al intentar eliminar al miembro. Es posible que sea administrador o que yo no tenga permisos." }, { quoted: msg });
    }
  }
};

export default kickCommand;