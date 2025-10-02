const demoteCommand = {
  name: "demote",
  category: "grupos",
  description: "Quita el rol de administrador a un miembro del grupo.",
  aliases: ["degradar"],
  group: true,
  admin: true,
  botAdmin: true,

  async execute({ sock, msg, args }) {
    let user;
    // Prioritize mentioned user over replied-to user
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        user = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        user = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(msg.key.remoteJid, { text: `🚩 Para degradar a alguien, menciona a la persona o responde a su mensaje.` }, { quoted: msg });
        }
        // Fallback for number input, though mention/reply is preferred
        const numberMatch = text.replace(/[^0-9]/g, '');
        if (!numberMatch) {
            return sock.sendMessage(msg.key.remoteJid, { text: `🚩 No se pudo identificar a un usuario válido.` }, { quoted: msg });
        }
        user = `${numberMatch}@s.whatsapp.net`;
    }

    if (!user) {
        return sock.sendMessage(msg.key.remoteJid, { text: `🚩 No se pudo identificar al usuario.` }, { quoted: msg });
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