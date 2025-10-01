import fetch from 'node-fetch';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace usando una nueva API.",
  aliases: ["fb", "fbdl", "fbvideo"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const fbRegex = /https?:\/\/(www\.|web\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

    if (!url || !fbRegex.test(url)) {
      const usageMessage = `📥 *Uso correcto del comando:*\n\n.facebook <enlace de Facebook>\n\n*Ejemplo:*\n.facebook https://www.facebook.com/watch/?v=1234567890`;
      return sock.sendMessage(msg.key.remoteJid, { text: usageMessage }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });

      const api = `https://api.dorratz.com/fbvideo?url=${encodeURIComponent(url)}`;
      const res = await fetch(api);
      const json = await res.json();

      if (!json || !Array.isArray(json) || json.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ No se encontró ningún video para ese enlace.' }, { quoted: msg });
      }

      let sentAny = false;
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Se encontraron ${json.length} calidades de video. Enviando...` }, { quoted: msg });

      for (const item of json) {
        if (!item.url || !item.resolution) continue;

        const caption = `📹 *Video de Facebook Descargado*\n\n*Resolución:* ${item.resolution}`;

        try {
          // Enviar cada calidad de video encontrada
          await sock.sendMessage(msg.key.remoteJid, {
            video: { url: item.url },
            caption: caption,
            mimetype: 'video/mp4'
          }, { quoted: msg });
          sentAny = true;
        } catch (sendError) {
          console.error(`Error al enviar video de Facebook (${item.resolution}):`, sendError);
          // Si una calidad falla, intentamos con la siguiente
          continue;
        }
      }

      if (sentAny) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ No se pudo enviar ningún video válido de las calidades encontradas.' }, { quoted: msg });
      }

    } catch (e) {
      console.error("Error en el comando facebook:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ No se pudo obtener el video. Verifica el enlace e intenta nuevamente.' }, { quoted: msg });
    }
  }
};

export default facebookCommand;