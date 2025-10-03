import { downloadTikTok } from '../lib/tiktok.js';

const tiktokAutoDownloader = {
  name: 'tiktok-auto-downloader',
  isAutoHandler: true,

  async execute({ sock, msg }) {
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!body) return;

    const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+)/i;
    const match = body.match(tiktokRegex);

    if (!match) return;

    const url = match[0];

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });
      const result = await downloadTikTok(url);

      const caption = `*${result.nickname || ''}* (@${result.username || ''})\n\n${result.description || 'Sin descripción'}`.trim();

      if (result.type === 'video') {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: { url: result.videoUrl },
            caption: caption,
          },
          { quoted: msg }
        );
      } else if (result.type === 'slide') {
        // For auto-downloads, we can send a summary and then the images.
        await sock.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });
        for (let i = 0; i < result.slides.length; i++) {
          await sock.sendMessage(msg.key.remoteJid, {
            image: { url: result.slides[i].url },
            caption: `🖼️ *Imagen ${i + 1} de ${result.slides.length}*`,
          }, { quoted: msg });
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error in TikTok auto-downloader:", error.message);
      // Fail silently with a reaction to avoid spam on broken links
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
    }
  }
};

export default tiktokAutoDownloader;