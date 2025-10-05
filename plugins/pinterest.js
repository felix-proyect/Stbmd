import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

// --- Helper para enviar álbumes ---
async function sendAlbum(sock, jid, medias, options = {}) {
  if (!medias || medias.length < 2) {
    throw new Error("Se necesitan al menos 2 imágenes para un álbum.");
  }

  const caption = options.caption || "";
  const delay = options.delay || 500;

  // Generar el mensaje contenedor del álbum
  const albumMessage = await baileys.generateWAMessageFromContent(
    jid,
    { albumMessage: { expectedImageCount: medias.length } },
    { userJid: sock.user.id }
  );

  // Enviar el contenedor
  await sock.relayMessage(albumMessage.key.remoteJid, albumMessage.message, { messageId: albumMessage.key.id });

  // Enviar cada imagen asociada al álbum
  for (let i = 0; i < medias.length; i++) {
    const mediaUrl = medias[i];
    const messageContent = {
      image: { url: mediaUrl },
      ...(i === 0 && caption ? { caption } : {}) // Añadir caption solo a la primera
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

// --- Comando Principal ---
const pinterestCommand = {
  name: "pinterest",
  category: "descargas",
  description: "Busca imágenes en Pinterest y las envía como un álbum.",
  aliases: ["pin"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: `*📌 Uso Correcto:*\n.pin <texto_a_buscar>` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

    try {
      const apiUrl = `https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl);

      if (!Array.isArray(data) || data.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: `No se encontraron resultados para "${query}".` }, { quoted: msg });
      }

      const imageUrls = data.map(item => item.image_large_url).filter(Boolean); // Filtrar por si alguna URL es null

      if (imageUrls.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: `No se encontraron imágenes válidas para "${query}".` }, { quoted: msg });
      }

      const maxImages = Math.min(imageUrls.length, 10);
      const medias = imageUrls.slice(0, maxImages);

      if (medias.length < 2) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: medias[0] }, caption: `*📌 Resultado para:* ${query}` }, { quoted: msg });
      } else {
        await sendAlbum(sock, msg.key.remoteJid, medias, {
          caption: `*📌 Resultados de:* ${query}\n*Imágenes:* ${maxImages}`,
          quoted: msg
        });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al buscar las imágenes en Pinterest.' }, { quoted: msg });
    }
  }
};

export default pinterestCommand;