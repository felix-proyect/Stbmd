import axios from "axios";
import https from "https";
import baileys from "@whiskeysockets/baileys";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// 🕒 delay helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 🖼️ Enviar imágenes como carrusel / galería
async function sendGallery(sock, jid, medias, options = {}) {
  const caption = options.caption || "";
  const quoted = options.quoted;

  const cards = [];

  for (let i = 0; i < medias.length; i++) {
    const url = medias[i];

    // Usar sock.prepareMessageMedia (la versión correcta)
    const upload = await sock.prepareMessageMedia(
      { image: { url } },
      { upload: sock.waUploadToServer }
    );

    cards.push({
      body: { text: i === 0 ? caption : "" },
      header: { hasMediaAttachment: true, ...upload },
    });
  }

  const galleryMessage = {
    message: {
      interactiveMessage: {
        header: { title: "Resultados de Pinterest 🖼️" },
        body: { text: caption },
        carouselMessage: { cards },
      },
    },
  };

  await sock.relayMessage(jid, galleryMessage.message, {
    messageId: baileys.generateMessageID(),
  });
}

// 📌 Comando Pinterest
const pinterestCommand = {
  name: "pinterest",
  category: "descargas",
  description: "Busca imágenes en Pinterest y las muestra en galería.",
  aliases: ["pin"],

  async execute({ sock, msg, args, usedPrefix, command }) {
    const text = args?.join(" ").trim();
    if (!text) {
      return sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `📌 *Uso correcto:*\n${usedPrefix + command} <búsqueda>\n\nEjemplo:\n${usedPrefix + command} gatos`,
        },
        { quoted: msg }
      );
    }

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key },
    });

    try {
      const apiUrl = `https://api-adonix.ultraplus.click/search/pinterest?apikey=gawrgurabot&q=${encodeURIComponent(
        text
      )}`;
      const { data } = await axios.get(apiUrl, { httpsAgent });

      if (!data.status || !data.results || data.results.length === 0) {
        throw new Error("No se encontraron imágenes para esa búsqueda.");
      }

      const imageUrls = data.results.slice(0, 10);

      await sendGallery(sock, msg.key.remoteJid, imageUrls, {
        caption: `📌 Resultados de *${text}*`,
        quoted: msg,
      });

      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "✅", key: msg.key },
      });
    } catch (error) {
      console.error("Error en Pinterest:", error);
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
