import axios from 'axios';
import config from '../config.js';

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga un video de TikTok sin marca de agua usando la API de RapidAPI.",
  aliases: ['ttdl', 'tt'],

  async execute({ sock, msg, text, usedPrefix, command }) {
    const apiKey = config.api.tiktok;
    if (!apiKey) {
      return sock.sendMessage(msg.key.remoteJid, { text: "La API key para este comando no está configurada por el propietario del bot en `config.js`." }, { quoted: msg });
    }

    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace de TikTok para descargar.\n\nEjemplo: *${usedPrefix + command}* <enlace>`
      }, { quoted: msg });
    }

    const url = text.trim();
    if (!url.includes('tiktok.com')) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de TikTok válido." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

      const options = {
        method: 'GET',
        url: 'https://tiktok-video-downloader-api.p.rapidapi.com/media',
        params: {
          videoUrl: url
        },
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'tiktok-video-downloader-api.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      const { data } = response;

      if (!data || !data.downloadUrl) {
        throw new Error("No se pudo obtener la URL de descarga desde la API.");
      }

      const caption = data.title ? `*${data.title}*` : 'Video de TikTok descargado.';

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.downloadUrl },
        caption: caption,
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      console.error("Error in tiktok command:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `😔 Lo siento, ocurrió un error al descargar el video.\n> La API puede estar caída o el enlace es inválido.`
      }, { quoted: msg });
    }
  }
};

export default tiktokCommand;