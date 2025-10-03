import { getUserFromMessage } from '../lib/utils.js';

const demoteCommand = {
  name: "demote",
  category: "grupos",
  description: "Quita el rol de administrador a un miembro del grupo.",
  aliases: ["degradar"],
  group: true,
  admin: true,
  botAdmin: false,

  async execute({ sock, msg, args }) {
    const user = getUserFromMessage(msg, args);

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: `🚩 Para degradar a alguien, menciona a la persona, responde a su mensaje o escribe su número.` }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], 'demote');
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ @${user.split('@')[0]} ya no es administrador.`, mentions: [user] }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '👍', key: msg.key } });
    } catch (e) {
      console.error("Error in demote command:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al intentar degradar al usuario. Verifica que sea un miembro del grupo.` }, { quoted: msg });
    }
  }
};

export default demoteCommand;