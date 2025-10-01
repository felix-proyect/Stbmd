import fetch from 'node-fetch';
import config from '../config.js';

// Simple in-memory lock to prevent spamming by a single user
const userRequests = new Set();

const instagramCommand = {
  name: "instagram",
  category: "descargas",
  description: "Descarga contenido de Instagram desde un enlace usando múltiples APIs como respaldo.",
  aliases: ["ig", "igdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const igRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[^\s]+/i;

    if (!url || !igRegex.test(url)) {
      const usageMessage = `📥 *Uso correcto del comando:*\n\n.instagram <enlace de Instagram>\n\n*Ejemplo:*\n.instagram https://www.instagram.com/p/C2sIo4aNCxZ/`;
      return sock.sendMessage(msg.key.remoteJid, { text: usageMessage }, { quoted: msg });
    }

    if (userRequests.has(msg.sender)) {
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Oye, calma. Ya tienes una descarga en proceso. Espera a que termine.` }, { quoted: msg });
    }

    userRequests.add(msg.sender);
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });

    // --- Array de APIs para intentar ---
    const downloadAttempts = [
      // API 1: Dorratz (usada en implementaciones anteriores del bot)
      async () => {
        console.log("Intentando con la API de Dorratz...");
        const res = await fetch(`https://api.dorratz.com/igdl?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!data.data || data.data.length === 0) throw new Error('Sin resultados de la API de Dorratz');
        return data.data; // Esta API devuelve un array de resultados
      },
      // API 2: Adonix (configurada en el bot)
      async () => {
        console.log("Intentando con la API de Adonix...");
        const apiUrl = `${config.api.adonix.baseURL}/download/instagram?apikey=${config.api.adonix.apiKey}&url=${encodeURIComponent(url)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.status !== "true" || !data.result || data.result.length === 0) throw new Error('Sin resultados de la API de Adonix');
        return data.result; // Esta API también devuelve un array
      },
       // API 3: Siputzx (del código de ejemplo, pública)
      async () => {
        console.log("Intentando con la API de Siputzx...");
        const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!data.data || data.data.length === 0) throw new Error('Sin resultados de la API de Siputzx');
        return data.data;
      }
    ];

    try {
      let results = null;
      for (const attempt of downloadAttempts) {
        try {
          results = await attempt();
          if (results) break; // Si tenemos éxito, salimos del bucle
        } catch (err) {
          console.error(`Fallo un intento de descarga de IG: ${err.message}`);
          continue; // Si falla, continuamos con la siguiente API
        }
      }

      if (!results || results.length === 0) {
        throw new Error('No se pudo descargar el contenido desde ninguna API.');
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Éxito! Se encontraron ${results.length} archivos. Enviando...` }, { quoted: msg });

      for (const item of results) {
        const fileUrl = item.url;
        const isVideo = fileUrl.includes('.mp4');
        const caption = isVideo ? '📹 Aquí está tu video de Instagram.' : '🖼️ Aquí está tu imagen de Instagram.';

        try {
          if (isVideo) {
            await sock.sendMessage(msg.key.remoteJid, { video: { url: fileUrl }, caption: caption }, { quoted: msg });
          } else {
            await sock.sendMessage(msg.key.remoteJid, { image: { url: fileUrl }, caption: caption }, { quoted: msg });
          }
        } catch (sendError) {
           console.error(`Error al enviar un archivo de IG:`, sendError);
           await sock.sendMessage(msg.key.remoteJid, { text: `❌ Falló el envío de uno de los archivos.`}, { quoted: msg });
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (e) {
      console.error("Error final en el comando instagram:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ No se pudo descargar el contenido. Por favor, verifica el enlace e inténtalo más tarde.' }, { quoted: msg });
    } finally {
      // Liberar el bloqueo para el usuario
      userRequests.delete(msg.sender);
    }
  }
};

export default instagramCommand;