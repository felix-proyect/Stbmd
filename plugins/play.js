import fetch from "node-fetch";
import yts from 'yt-search';
import config from '../config.js';

// Helper function to format large numbers for display
function formatViews(views) {
  if (views === undefined || views === null) return "No disponible";
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return views.toString();
}

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga audio o video de YouTube.",
  aliases: ['yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4'],

  async execute({ sock, msg, args, commandName }) {
    const text = args.join(' ');
    if (!text.trim()) {
      return sock.sendMessage(msg.key.remoteJid, { text: `❀ Por favor, ingresa el nombre de la música a descargar.` }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });

      const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;
      const videoIdMatch = text.match(youtubeRegexID);
      const searchQuery = videoIdMatch ? `https://youtu.be/${videoIdMatch[1]}` : text;

      const searchResults = await yts(searchQuery);
      const video = searchResults.videos[0];

      if (!video) {
        return sock.sendMessage(msg.key.remoteJid, { text: '✧ No se encontraron resultados para tu búsqueda.' }, { quoted: msg });
      }

      const { title, thumbnail, timestamp, views, ago, url, author } = video;
      const formattedViews = formatViews(views);
      const channel = author ? author.name : 'Desconocido';

      const infoMessage = `「✦」Descargando *<${title || 'Desconocido'}>*\n\n` +
                          `> 📺 Canal ✦ *${channel}*\n` +
                          `> 👀 Vistas ✦ *${formattedViews || 'Desconocido'}*\n` +
                          `> ⏳ Duración ✦ *${timestamp || 'Desconocido'}*\n` +
                          `> 📆 Publicado ✦ *${ago || 'Desconocido'}*\n` +
                          `> 🖇️ Link ✦ ${url}`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: thumbnail },
        caption: infoMessage,
        contextInfo: {
          externalAdReply: {
            title: config.botName, // Adaptado para usar config
            body: `By: ${config.ownerName}`, // Adaptado para usar config
            mediaType: 1,
            thumbnail: await (await fetch(thumbnail)).buffer(),
            mediaUrl: url,
            sourceUrl: url,
            renderLargerThumbnail: true,
          }
        }
      }, { quoted: msg });

      if (['play', 'yta', 'ytmp3', 'playaudio'].includes(commandName)) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { react: { text: '🎵', key: msg.key } });
          const apiRes = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${url}`);
          const apiJson = await apiRes.json();
          const downloadUrl = apiJson.result.download.url;

          if (!downloadUrl) throw new Error('El enlace de audio no se generó correctamente.');

          await sock.sendMessage(msg.key.remoteJid, { audio: { url: downloadUrl }, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: msg });
        } catch (e) {
          console.error("Error al descargar audio:", e);
          return sock.sendMessage(msg.key.remoteJid, { text: '✦ No se pudo enviar el audio. El archivo puede ser demasiado pesado o la API falló.' }, { quoted: msg });
        }
      } else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(commandName)) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { react: { text: '📹', key: msg.key } });
          const apiRes = await fetch(`https://api.neoxr.eu/api/youtube?url=${url}&type=video&quality=480p&apikey=GataDios`);
          const apiJson = await apiRes.json();
          const downloadUrl = apiJson.data.url;

          if (!downloadUrl) throw new Error('No se pudo generar el enlace de video.');

          await sock.sendMessage(msg.key.remoteJid, { video: { url: downloadUrl }, caption: title }, { quoted: msg });
        } catch (e) {
          console.error("Error al descargar video:", e);
          return sock.sendMessage(msg.key.remoteJid, { text: '✦ No se pudo enviar el video. El archivo puede ser demasiado pesado o la API falló.' }, { quoted: msg });
        }
      }

    } catch (error) {
      console.error("Error en el comando play:", error);
      return sock.sendMessage(msg.key.remoteJid, { text: `✦ Ocurrió un error: ${error.message}` }, { quoted: msg });
    }
  }
};

export default playCommand;