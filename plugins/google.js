import fetch from 'node-fetch';
import * as cheerio from 'cheerio'; // Asegúrate de tener cheerio instalado

const googleCommand = {
  name: "google",
  category: "buscador",
  description: "Realiza una búsqueda en Google y muestra los resultados sin usar API.",
  aliases: ["search"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: `🐇 Por favor, proporciona un término para buscar en Google.` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });

    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es`;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      };

      const res = await fetch(url, { headers });
      const html = await res.text();

      const $ = cheerio.load(html);
      const results = [];

      $('div.tF2Cxc').each((i, el) => {
        const title = $(el).find('h3').text();
        const link = $(el).find('a').attr('href');
        const desc = $(el).find('.VwiC3b').text();
        if (title && link) {
          results.push({ title, link, desc });
        }
      });

      if (results.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' }, { quoted: msg });
      }

      let replyMessage = `*「 🔎 」 Resultados de Google para: "${query}"*\n\n`;
      results.slice(0, 8).forEach((item, index) => {
        replyMessage += `*${index + 1}. ${item.title}*\n`;
        replyMessage += `_${item.desc || 'Sin descripción'}_\n`;
        replyMessage += `*Enlace:* ${item.link}\n\n`;
      });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg });

    } catch (error) {
      console.error(`Error al obtener resultados de Google:`, error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al obtener los resultados.` }, { quoted: msg });
    }
  }
};

export default googleCommand;
