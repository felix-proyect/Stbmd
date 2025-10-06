import axios from 'axios';
import https from 'https';

// Agente para ignorar la validación del certificado SSL, haciendo la conexión más robusta.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const pinterestCommand = {
  name: "pinterest",
  category: "descargas",
  description: "Busca imágenes en Pinterest. Puedes especificar la cantidad.",
  aliases: ["pin"],

  async execute({ sock, msg, text, usedPrefix, command }) {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: `✧ Por favor, proporciona un término de búsqueda.\n\n*Ejemplo:*\n*${usedPrefix + command} Gura 5*` }, { quoted: msg });
    }

    const args = text.split(' ');
    let query = '';
    let count = 1; // Número de imágenes por defecto

    // Comprobar si el último argumento es un número para la cantidad
    const lastArg = parseInt(args[args.length - 1], 10);
    if (!isNaN(lastArg)) {
      count = Math.min(lastArg, 15); // Limitar a un máximo de 15 para no saturar
      query = args.slice(0, -1).join(' ');
    } else {
      query = text;
    }

    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: `✧ Debes proporcionar un término de búsqueda.\n\n*Ejemplo:*\n*${usedPrefix + command} Gura 5*` }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { text: `Buscando ${count} imagen(es) de "${query}" en Pinterest...` }, { quoted: m });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });

    try {
      const apiUrl = `https://api.platform.web.id/pinterest?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl, { httpsAgent });

      if (data.status !== true || !data.results || data.results.length === 0) {
        throw new Error('No se encontraron imágenes para esa búsqueda.');
      }

      const results = data.results;

      // Barajar el array de resultados para obtener variedad
      results.sort(() => 0.5 - Math.random());

      // Enviar el número de imágenes solicitado
      for (let i = 0; i < Math.min(count, results.length); i++) {
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: results[i] },
            caption: `Imagen ${i + 1}/${count} de "${query}"`
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando Pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al buscar en Pinterest.\n\n*Error:* ${error.message}` }, { quoted: msg });
    }
  }
};

export default pinterestCommand;