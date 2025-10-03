import axios from 'axios';

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga un video de TikTok sin marca de agua.",
  aliases: ['ttdl', 'tt'],

  async execute({ sock, msg, text, usedPrefix, command }) {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace para descargar.\n\nEjemplo: *${usedPrefix + command}* <enlace>`
      }, { quoted: msg });
    }

    const url = text.trim();

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

      const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data || !data.data.meta?.media) {
        throw new Error("No se pudo obtener la información del video desde la API.");
      }

      // Find the video URL without watermark
      const videoUrl = data.data.meta.media.find(v => v.type === "video")?.org;
      if (!videoUrl) {
        throw new Error("No se encontró la URL del video sin marca de agua en la respuesta.");
      }

      const { title, author, like, comment, share } = data.data;
      const caption = `*${author.nickname}* (@${author.username})\n\n` +
                      `*Título:* ${title || 'Sin título'}\n` +
                      `*Likes:* ${like} | *Comentarios:* ${comment} | *Compartidos:* ${share}`;

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: videoUrl },
        caption: caption,
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      console.error("Error in tiktok command:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `😔 Lo siento, ocurrió un error al descargar el video.\n> ${e.message}`
      }, { quoted: msg });
    }
  }
};

export default tiktokCommand;