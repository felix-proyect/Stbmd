import fetch from 'node-fetch';

const SEARCH_API_KEY = 'yVoHmx96Dt8hJqtqyDxfRqYG'; // Tu API key de SearchAPI.io

const googleCommand = {
  name: "google",
  category: "buscador",
  description: "Realiza una búsqueda en Google usando SearchAPI.io",
  aliases: ["search"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `🐇 Por favor, proporciona un término para buscar en Google.` 
      }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });

    try {
      const apiUrl = `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&api_key=${SEARCH_API_KEY}`;
      const res = await fetch(apiUrl);
      const json = await res.json();

      // Validar respuesta
      const results = json.organic_results;
      if (!results || results.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ No se encontraron resultados para tu búsqueda.' 
        }, { quoted: msg });
      }

      // Formatear mensaje
      let replyMessage = `*「 🔎 」 Resultados de Google para: "${query}"*\n\n`;
      results.slice(0, 8).forEach((item, index) => {
        replyMessage += `*${index + 1}. ${item.title || 'Sin título'}*\n`;
        replyMessage += `_${item.snippet || 'Sin descripción'}_\n`;
        replyMessage += `*Enlace:* ${item.link}\n\n`;
      });

      // Enviar resultado
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg });

    } catch (error) {
      console.error('Error al usar SearchAPI.io:', error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `⚠️ Ocurrió un error al obtener los resultados. Puede que la API esté temporalmente inactiva.` 
      }, { quoted: msg });
    }
  }
};

export default googleCommand;
