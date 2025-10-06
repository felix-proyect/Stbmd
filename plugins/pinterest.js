import axios from 'axios';
import https from 'https';
import baileys from '@whiskeysockets/baileys';

// Agente para ignorar la validación del certificado SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// --- Helper para enviar álbumes ---
async function sendAlbum(sock, jid, medias, options = {}) {
  if (!medias || medias.length < 2) {
    throw new Error("Se necesitan al menos 2 imágenes para un álbum.");
  }

  const caption = options.caption || "";
  const delay = options.delay || 500;

  const albumMessage = await baileys.generateWAMessageFromContent(
    jid,
    { albumMessage: { expectedImageCount: medias.length } },
    { userJid: sock.user.id }
  );

  await sock.relayMessage(albumMessage.key.remoteJid, albumMessage.message, { messageId: albumMessage.key.id });

  for (let i = 0; i < medias.length; i++) {
    const mediaUrl = medias[i];
    const messageContent = {
      image: { url: mediaUrl },
      ...(i === 0 && caption ? { caption } : {})
    };

    const waMessage = await baileys.generateWAMessage(
      jid,
      messageContent,
      {
        upload: sock.waUploadToServer,
        quoted: options.quoted
      }
    );

    waMessage.message.messageContextInfo = {
      messageAssociation: {
        associationType: 1,
        parentMessageKey: albumMessage.key
      },
    };

    await sock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    await baileys.delay(delay);
  }
  return albumMessage;
}


const pinterestCommand = {
  name: "pinterest",
  category: "descargas",
  description: "Busca y descarga todas las imágenes encontradas en Pinterest.",
  aliases: ["pin"],

  async execute({ sock, msg, text, usedPrefix, command }) {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: `*📌 Uso Correcto:*\n*${usedPrefix + command}* Gura` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

    try {
      const apiUrl = `https://api.platform.web.id/pinterest?q=${encodeURIComponent(text)}`;
      const { data } = await axios.get(apiUrl, { httpsAgent });

      if (data.status !== true || !data.results || data.results.length === 0) {
        throw new Error('No se encontraron imágenes para esa búsqueda.');
      }

      const imageUrls = data.results;

      await sock.sendMessage(msg.key.remoteJid, { text: `Encontré ${imageUrls.length} imágenes. Enviando álbum...`}, { quoted: msg });

      if (imageUrls.length < 2) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: imageUrls[0] }, caption: `*📌 Resultado para:* ${text}` }, { quoted: msg });
      } else {
        await sendAlbum(sock, msg.key.remoteJid, imageUrls, {
          caption: `*📌 Resultados de:* ${text}`,
          quoted: msg
        });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando Pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al buscar en Pinterest.\n\n*Error:* ${error.message}` }, { quoted: msg });
    }
  }
};

export default pinterestCommand;