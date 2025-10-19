const joinCommand = {
  name: "join",
  category: "general",
  description: "Hace que el bot se una a un grupo de WhatsApp mediante enlace. Si no eres owner, enviará la solicitud al dueño.",

  async execute({ sock, msg, args, config }) {
    try {
      const link = args[0];
      const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/;
      const match = link?.match(linkRegex);

      if (!match) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "❌ *Link inválido.*\nPor favor, proporciona un enlace de invitación de grupo válido 🌊",
        }, { quoted: msg });
      }

      const inviteCode = match[1];
      const sender = msg.sender;
      const senderName = msg.pushName || sender.split('@')[0];
      const owners = config.ownerNumbers.map(owner => owner.endsWith('@s.whatsapp.net') ? owner : `${owner}@s.whatsapp.net`);
      const isOwner = owners.includes(sender);

      if (isOwner) {
        // 💫 Si es el dueño → el bot se une directamente
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🦈", key: msg.key } });

        await sock.groupAcceptInvite(inviteCode);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ *¡Me he unido al grupo exitosamente!* 🌊\n_Invitado por el owner (${senderName})_`,
        }, { quoted: msg });

        return;
      }

      // 🌊 Si no es owner → se envía solicitud a los dueños
      const requestMessage = `
🚨 *Solicitud de unión a grupo* 🚨
──────────────────────────────
👤 *De:* ${senderName}
📱 *Número:* ${sender.split('@')[0]}
🔗 *Enlace:* ${link}
──────────────────────────────
Usa:
> *.joingroup ${link}*
para que el bot se una 🌊
`;

      for (const ownerJid of owners) {
        await sock.sendMessage(ownerJid, { text: requestMessage });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: "✅ *Tu solicitud ha sido enviada al propietario del bot.* 🦈\nEspera a que sea aprobada.",
      }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando join:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Ocurrió un error procesando tu solicitud para unirte al grupo. 🦈",
      }, { quoted: msg });
    }
  },
};

export default joinCommand;
