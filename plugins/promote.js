const promoteCommand = {
  name: "promote",
  category: "grupos",
  description: "Asigna el rol de administrador a un miembro del grupo.",
  aliases: ["daradmin", "darpoder"],
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
            return sock.sendMessage(msg.key.remoteJid, { text: `🚩 Para ascender a alguien, menciona a la persona o responde a su mensaje.` }, { quoted: msg });
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