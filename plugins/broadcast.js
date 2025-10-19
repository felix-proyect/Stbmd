const broadcastCommand = {
  name: "broadcast",
  category: "propietario",
  description: "Envía un aviso del Owner a todos los grupos con autoeliminación en 1 hora.",
  aliases: ["bc"],

  async execute({ sock, msg, args, config }) {
    try {
      const senderId = msg.key.participant || msg.key.remoteJid;
      const senderNumber = senderId.split("@")[0];
      const ownerNumbers = config.ownerNumbers.map(n => n.replace(/[^0-9]/g, ""));

      if (!ownerNumbers.includes(senderNumber)) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ *Solo el Owner puede usar este comando.* 🌊" },
          { quoted: msg }
        );
      }

      const messageToBroadcast = args.join(" ");
      const hasQuoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!messageToBroadcast && !hasQuoted && !msg.message?.imageMessage && !msg.message?.videoMessage) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "💬 Escribe un mensaje, responde uno o envía un archivo para enviar a todos los grupos." },
          { quoted: msg }
        );
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🦈", key: msg.key } });

      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `🌊 *Iniciando broadcast...*\nEnviando aviso a ${groupIds.length} grupos...` },
        { quoted: msg }
      );

      let successCount = 0;
      let errorCount = 0;

      const decoratedText = `
╭───────🌊───────╮
   👑 *Aviso del Owner* 👑
╰───────🦈───────╯

${messageToBroadcast || "_(mensaje reenviado)_"}
────────────────────
🤍 *Atentamente:* Gura Bot
`;

      const delay = ms => new Promise(r => setTimeout(r, ms));

      async function sendWithRetry(groupId, content, mentions = [], retries = 2) {
        for (let i = 0; i <= retries; i++) {
          try {
            const sentMsg = await sock.sendMessage(groupId, { ...content, mentions });
            // 🕒 Autoeliminación después de 1 hora
            setTimeout(async () => {
              try {
                await sock.sendMessage(groupId, {
                  delete: {
                    remoteJid: groupId,
                    fromMe: true,
                    id: sentMsg.key.id,
                    participant: sentMsg.key.participant || undefined,
                  },
                });
              } catch (err) {
                console.error("No se pudo eliminar el mensaje automáticamente:", err);
              }
            }, 3600000);
            return true;
          } catch (e) {
            console.error(`Error al enviar a ${groupId} (intento ${i + 1}):`, e);
            if (i < retries) {
              await delay(1500);
              console.log(`🔁 Reintentando grupo ${groupId}...`);
            }
          }
        }
        return false;
      }

      for (const groupId of groupIds) {
        const groupMetadata = groups[groupId];
        const participants = groupMetadata.participants.map(p => p.id);
        const mentions = participants; // menciones ocultas

        let content = {};

        if (msg.message?.imageMessage) {
          content = { image: msg.message.imageMessage, caption: decoratedText };
        } else if (msg.message?.videoMessage) {
          content = { video: msg.message.videoMessage, caption: decoratedText };
        } else if (hasQuoted) {
          const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
          content = { forward: quoted, caption: decoratedText };
        } else {
          content = { text: decoratedText };
        }

        const sent = await sendWithRetry(groupId, content, mentions, 2);
        sent ? successCount++ : errorCount++;

        await delay(3000); // ⏳ Delay de 3 segundos
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `✅ *Broadcast Finalizado*\n\n📬 Enviado a: ${successCount} grupos\n⚠️ Fallos: ${errorCount} grupos\n\n🕒 Los mensajes se eliminarán automáticamente en 1 hora.`,
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
    } catch (e) {
      console.error("Error en broadcast:", e);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Ocurrió un error al intentar enviar el broadcast. 🦈" },
        { quoted: msg }
      );
    }
  },
};

export default broadcastCommand;
