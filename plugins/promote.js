import { getUserFromMessage } from '../lib/utils.js';

const promoteCommand = {
  name: "promote",
  category: "grupos",
  description: "Asigna el rol de administrador a un miembro del grupo.",
  aliases: ["daradmin", "darpoder"],
  group: true,
  admin: true,
  botAdmin: false,

  async execute({ sock, msg, args }) {
    const user = getUserFromMessage(msg, args);

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: `🚩 Para ascender a alguien, menciona a la persona, responde a su mensaje o escribe su número.` }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], 'promote');
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ @${user.split('@')[0]} ahora es administrador del grupo.`, mentions: [user] }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '👑', key: msg.key } });
    } catch (e) {
      console.error("Error in promote command:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al intentar ascender al usuario. Verifica que sea un miembro del grupo.` }, { quoted: msg });
    }
  }
};

export default promoteCommand;