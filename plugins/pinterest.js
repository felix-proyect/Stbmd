import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

// Lista de APIs a utilizar, en orden de prioridad.
const API_ENDPOINTS = [
  'https://api.dorratz.com/v2/pinterest?q=',
  'https://anime-xi-wheat.vercel.app/api/pinterest?q='
];

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
    const media = medias[i];
    const messageContent = {
      image: { url: media.url },
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

    let imageResults = [];

    // Intentar con cada API de la lista
    for (const apiUrl of API_ENDPOINTS) {
      try {
        const { data } = await axios.get(`${apiUrl}${encodeURIComponent(query)}`);

        let processedResults = [];
        if (apiUrl.includes('dorratz')) {
          // La API de Dorratz devuelve un array de objetos
          if (Array.isArray(data) && data.length > 0) {
            processedResults = data.map(img => ({ url: img.image_large_url }));
          }
        } else if (apiUrl.includes('anime-xi-wheat')) {
          // La otra API devuelve un objeto con un array de strings
          if (data && Array.isArray(data.images) && data.images.length > 0) {
            processedResults = data.images.map(url => ({ url }));
          }
        }

        if (processedResults.length > 0) {
          imageResults = processedResults;
          break; // Si encontramos resultados, dejamos de buscar
        }
      } catch (error) {
        console.error(`API ${apiUrl} falló:`, error.message);
        // Si una API falla, el bucle continuará con la siguiente.
      }
    }

    if (imageResults.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      return sock.sendMessage(msg.key.remoteJid, { text: `No se encontraron resultados para "${query}".` }, { quoted: msg });
    }

    const maxImages = Math.min(imageResults.length, 10);
    const medias = imageResults.slice(0, maxImages);

    try {
      if (medias.length < 2) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: medias[0].url }, caption: `*📌 Resultado para:* ${query}` }, { quoted: msg });
      } else {
        await sendAlbum(sock, msg.key.remoteJid, medias, {
          caption: `*📌 Resultados de:* ${query}\n*Imágenes:* ${maxImages}`,
          quoted: msg
        });
      }
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
    } catch (error) {
      console.error("Error al enviar el álbum de Pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al enviar las imágenes.' }, { quoted: msg });
    }
  }
};

export default pinterestCommand;