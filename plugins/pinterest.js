import axios from "axios";
import https from "https";

// 🔒 Ignorar certificados SSL inválidos
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// 🕒 Delay manual (reemplaza a baileys.delay)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- 🖼️ Helper para enviar imágenes como “álbum simulado” ---
async function sendAlbum(sock, jid, medias, options = {}) {
  const caption = options.caption || "";
  const delayTime = options.delay || 800;
  const quoted = options.quoted;

  for (let i = 0; i < medias.length; i++) {
    const mediaUrl = medias[i];
    const message = {
      image: { url: mediaUrl },
      caption: i === 0 ? caption : undefined, // solo la primera lleva texto
    };

    await sock.sendMessage(jid, message, { quoted });
    await sleep(delayTime); // ⏳ Espera antes del siguiente mensaje
  }
}

// --- 📌 Comando Pinterest funcional y estable ---
const pinterestCommand = {
  name: "pinterest",
  category: "descargas",
  description: "Busca y descarga imágenes de Pinterest.",
  aliases: ["pin"],

  async execute({ sock, msg, args, usedPrefix, command }) {
    const text = args?.join(" ").trim();
    if (!text) {
      return sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `*📌 Uso correcto:*\n${usedPrefix + command} Gura\n\nEjemplo:\n${usedPrefix + command} gatos`,
        },
        { quoted: msg }
      );
    }

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key },
    });

    try {
      // 🔹 API de Adonix
      const apiUrl = `https://api-adonix.ultraplus.click/search/pinterest?apikey=gawrgurabot&q=${encodeURIComponent(
        text
      )}`;
      const { data } = await axios.get(apiUrl, { httpsAgent });

      if (!data.status || !data.results || data.results.length === 0) {
        throw new Error("No se encontraron imágenes para esa búsqueda.");
      }

      const imageUrls = data.results;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `🖼️ Encontré *${imageUrls.length}* imágenes para *${text}*.\nEnviando resultados...`,
        },
        { quoted: msg }
      );

      // Limitar a máximo 10 imágenes (opcional)
      const limitedImages = imageUrls.slice(0, 10);

      if (limitedImages.length === 1) {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: { url: limitedImages[0] },
            caption: `*📌 Resultado para:* ${text}\n🔗 *Fuente:* Adonix`,
          },
          { quoted: msg }
        );
      } else {
        await sendAlbum(sock, msg.key.remoteJid, limitedImages, {
          caption: `*📌 Resultados de:* ${text}\n🔗 *Fuente:* Adonix`,
          quoted: msg,
        });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "✅", key: msg.key },
      });
    } catch (error) {
      console.error("Error en el comando Pinterest:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "❌", key: msg.key },
      });
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ Ocurrió un error al buscar en Pinterest.\n\n*Error:* ${error.message}`,
        },
        { quoted: msg }
      );
    }
  },
};

export default pinterestCommand;
