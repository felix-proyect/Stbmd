import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

// Helper function to fetch Pinterest image URLs
async function searchPins(query) {
  try {
    const { data } = await axios.get(`https://anime-xi-wheat.vercel.app/api/pinterest?q=${encodeURIComponent(query)}`);
    // The API returns an object with an 'images' array
    return Array.isArray(data.images) ? data.images : [];
  } catch (error) {
    console.error('Error fetching from Pinterest API:', error);
    return [];
  }
}

// Helper function to send an album of media, adapted for this bot's structure
async function sendAlbum(sock, jid, medias, options = {}) {
  if (medias.length < 2) throw new RangeError("Album requires at least 2 media items.");

  const caption = options.caption || "";
  const delay = !isNaN(options.delay) ? options.delay : 500;

  // Generate the initial album message structure
  const albumMessage = baileys.generateWAMessageFromContent(
    jid,
    { albumMessage: { expectedImageCount: medias.length } },
    { userJid: sock.user.id }
  );

  // Relay the album creation message
  await sock.relayMessage(albumMessage.key.remoteJid, albumMessage.message, { messageId: albumMessage.key.id });

  // Send each image, associating it with the album
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    const messageContent = {
      [media.type]: { url: media.data.url },
      ...(i === 0 ? { caption } : {}) // Add caption only to the first image
    };

    const waMessage = await baileys.generateWAMessage(
      jid,
      messageContent,
      {
        upload: sock.waUploadToServer,
        quoted: options.quoted // Quote the original message
      }
    );

    // Associate this message with the album we created
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
  category: "buscador",
  description: "Busca imágenes en Pinterest y las envía como un álbum.",
  aliases: ["pin"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Por favor, ingresa un término de búsqueda.\n\n*Ejemplo:*\n.pin Gura` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });

    try {
      const results = await searchPins(query);
      if (results.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No se encontraron resultados para "${query}".` }, { quoted: msg });
      }

      // Prepare up to 15 images for the album
      const maxImages = Math.min(results.length, 15);
      const medias = results.slice(0, maxImages).map(url => ({
        type: 'image',
        data: { url }
      }));

      if (medias.length < 2) {
         return sock.sendMessage(msg.key.remoteJid, { text: `Solo encontré una imagen para "${query}", enviando directamente...` }, { quoted: msg })
         .then(() => sock.sendMessage(msg.key.remoteJid, { image: { url: medias[0].data.url }, caption: `Resultado para: ${query}` }, { quoted: msg }));
      }

      await sendAlbum(sock, msg.key.remoteJid, medias, {
        caption: `Resultados de: *${query}*\nImágenes encontradas: ${maxImages}`,
        quoted: msg
      });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al buscar las imágenes en Pinterest.' }, { quoted: msg });
    }
  }
};

export default pinterestCommand;