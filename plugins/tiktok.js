import axios from 'axios';
import config from '../config.js';

const tiktokCommand = {
  name: "tiktok",
  category: "descargas",
  description: "Descarga un video de TikTok sin marca de agua.",
  aliases: ['ttdl', 'tt'],

  async execute({ sock, msg, text, usedPrefix, command }) {
    const apiKey = config.api.tiktok;
    if (!apiKey) {
      return sock.sendMessage(msg.key.remoteJid, { text: "La API key para este comando no está configurada por el propietario del bot en `config.js`." }, { quoted: msg });
    }

    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace o texto para buscar en TikTok.\n\nEjemplo: *${usedPrefix + command}* <enlace_o_texto>`
      }, { quoted: msg });
    }

    const videoUrl = text.trim();

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

      const options = {
        method: 'GET',
        url: 'https://tiktok-video-downloader-api.p.rapidapi.com/media',
        params: {
          videoUrl: videoUrl
        },
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'tiktok-video-downloader-api.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const { data } = response;

      if (!data || !data.downloadUrl) {
        throw new Error("La API no devolvió una URL de descarga válida.");
      }

      const caption = data.title ? `*${data.title}*` : 'Video de TikTok descargado.';

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.downloadUrl },
        caption: caption,
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
      console.error("Error en el comando 'tiktok':", error.message);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `😔 Lo siento, ocurrió un error.\n\nLa API no pudo procesar la solicitud. Asegúrate de que el enlace sea correcto o inténtalo de nuevo más tarde.`
      }, { quoted: msg });
    }
  }
};

export default tiktokCommand;