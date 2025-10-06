import axios from 'axios';
import https from 'https';

// Agente para ignorar la validación del certificado SSL, haciendo la conexión más robusta.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const mediafireCommand = {
  name: "mediafire",
  category: "descargas",
  description: "Descarga archivos desde enlaces de MediaFire.",
  aliases: ["mf", "mfdl"],

  async execute({ sock, msg, args, usedPrefix, command }) {
    if (!args[0]) {
      return sock.sendMessage(msg.key.remoteJid, { text: `*❌ Uso incorrecto.*\n\n*Ejemplo:*\n*${usedPrefix + command}* https://www.mediafire.com/file/xxxx` }, { quoted: msg });
    }

    const mediaFireUrlPattern = /(?:https?:\/\/)?(?:www\.)?mediafire\.com\/file\//i;
    if (!mediaFireUrlPattern.test(args[0])) {
      return sock.sendMessage(msg.key.remoteJid, { text: '❌ URL de MediaFire no válida. Por favor, proporciona un enlace de archivo válido.' }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⌛', key: msg.key } });

    try {
      const apiUrl = `https://api.platform.web.id/mediafire?url=${encodeURIComponent(args[0])}`;
      const { data: json } = await axios.get(apiUrl, { httpsAgent });

      if (!json.downloadUrl || !json.name) {
        throw new Error(json.error || json.message || 'La API no devolvió una respuesta válida.');
      }

      if (!json.downloadUrl.startsWith('http')) {
        throw new Error('La API devolvió una URL de descarga no válida.');
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

      let caption = `*📥 Descarga de MediaFire*\n\n` +
                    `📄 *Archivo:* ${json.name || 'Desconocido'}\n` +
                    `📦 *Tamaño:* ${json.details?.size || 'Desconocido'}\n` +
                    `📅 *Subido:* ${json.details?.uploadTime || 'Desconocido'}\n` +
                    `🗂️ *Tipo:* ${json.details?.fileType || 'Desconocido'}\n\n` +
                    `_Descargando archivo, por favor espera..._`;

      await sock.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });

      try {
        await sock.sendMessage(msg.key.remoteJid, {
          document: { url: json.downloadUrl },
          fileName: json.name,
          mimetype: json.details?.mimeType || 'application/octet-stream'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '📁', key: msg.key } });

      } catch (downloadError) {
        console.error('Error al enviar el archivo:', downloadError);

        const fallbackMsg = `❌ No se pudo enviar el archivo directamente. Aquí está el enlace de descarga:\n\n` +
                             `🔗 *Enlace de Descarga:*\n${json.downloadUrl}\n\n` +
                             `📄 *Nombre:* ${json.name}\n` +
                             `📦 *Tamaño:* ${json.details.size}`;

        await sock.sendMessage(msg.key.remoteJid, { text: fallbackMsg }, { quoted: msg });
      }

    } catch (error) {
      console.error('Error en el manejador de MediaFire:', error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });

      let errorMessage = '❌ Falló la descarga del archivo de MediaFire.\n\n';
      errorMessage += `⚠️ *Motivo:* ${error.message || 'Error desconocido.'}`;

      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default mediafireCommand;