import { downloadTikTok } from '../lib/tiktok.js';

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga videos o imágenes de TikTok sin marca de agua.",
  aliases: ['ttdl', 'tt'],

  async execute({ sock, msg, text, usedPrefix, command }) {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace de TikTok.\n\nEjemplo: *${usedPrefix + command}* https://vt.tiktok.com/abcd/`
      }, { quoted: msg });
    }

    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró un enlace válido en el mensaje." }, { quoted: msg });
    }
    const url = urlMatch[0];

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });
      const result = await downloadTikTok(url);

      const caption = `*${result.nickname || ''}* (@${result.username || ''})\n\n${result.description || 'Sin descripción'}`.trim();

      if (result.type === 'video') {
        await sock.sendMessage(msg.key.remoteJid, {
          video: { url: result.videoUrl },
          caption: caption
        }, { quoted: msg });
      } else if (result.type === 'slide') {
        await sock.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });
        for (let i = 0; i < result.slides.length; i++) {
          await sock.sendMessage(msg.key.remoteJid, {
            image: { url: result.slides[i].url },
            caption: `🖼️ *Imagen ${i + 1} de ${result.slides.length}*`
          }, { quoted: msg });
        }
      }

      if (result.audioUrl) {
        await sock.sendMessage(msg.key.remoteJid, {
          audio: { url: result.audioUrl },
          mimetype: 'audio/mpeg'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✨", key: msg.key } });

    } catch (e) {
      console.error("Error in tiktok command:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⛔️", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `😔 Vaya, falló la descarga desde TikTok.\n> \`${e.message}\`\n\nIntenta con otro enlace.`
      }, { quoted: msg });
    }
  }
};

export default tiktokCommand;