import fetch from 'node-fetch';

const googleCommand = {
  name: "google",
  category: "buscador",
  description: "Realiza una búsqueda en Google y muestra los resultados.",
  aliases: ["search"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: `🐇 Por favor, proporciona un término para buscar en Google.` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });
    const apiUrl = `https://vapis.my.id/api/googlev1?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!result.status || !result.data || result.data.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' }, { quoted: msg });
      }

      let replyMessage = `*「 🔎 」 Resultados de Google para: "${query}"*\n\n`;
      result.data.forEach((item, index) => {
        replyMessage += `*${index + 1}. ${item.title}*\n`;
        replyMessage += `_${item.desc}_\n`;
        replyMessage += `*Enlace:* ${item.link}\n\n`;
      });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg });

    } catch (error) {
      console.error(`Error al realizar la solicitud a la API de Google:`, error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al obtener los resultados.` }, { quoted: msg });
    }
  }
};

export default googleCommand;