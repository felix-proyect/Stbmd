import axios from "axios";

const animeclipCommand = {
  name: "animeclip",
  category: "diversion",
  description: "Envía un clip o GIF de anime aleatorio.",
  aliases: ["clip", "animevideo"],

  async execute({ sock, msg }) {
    const chat = msg.key.remoteJid;

    // Aviso de búsqueda
    await sock.sendMessage(chat, { text: "🎬 *Buscando un clip de anime...* 🌸" }, { quoted: msg });

    // APIs que pueden devolver video o gif
    const apis = [
      "https://api.waifu.pics/sfw/dance",
      "https://api.waifu.pics/sfw/wink",
      "https://api.waifu.pics/sfw/happy",
      "https://api.waifu.pics/sfw/cringe",
      "https://nekos.best/api/v2/dance",
      "https://nekos.best/api/v2/wave",
      "https://api.otakugifs.xyz/gif?reaction=dance",
      "https://api.otakugifs.xyz/gif?reaction=smile",
      "https://kawaii.red/api/gif/wave/tokenfree"
    ];

    let mediaUrl = null;

    // Intentar obtener una URL válida
    for (const api of apis.sort(() => Math.random() - 0.5)) {
      try {
        const res = await axios.get(api, { timeout: 15000 });

        const posiblesUrls = [
          res.data?.url,
          res.data?.response?.url,
          res.data?.results?.[0]?.url,
          res.data?.data?.[0]?.url,
          res.data?.gif
        ].filter(Boolean);

        const encontrada = posiblesUrls.find(u => /\.(mp4|gif)$/i.test(u));
        if (encontrada) {
          mediaUrl = encontrada;
          break;
        }
      } catch (err) {
        console.log("❌ Falló API:", api);
      }
    }

    if (!mediaUrl) {
      return sock.sendMessage(chat, { text: "🚫 No se pudo encontrar un clip o GIF de anime en este momento." }, { quoted: msg });
    }

    try {
      // Descargar el contenido
      const res = await axios.get(mediaUrl, { responseType: "arraybuffer", timeout: 30000 });
      const contentType = res.headers["content-type"] || "";
      const buffer = Buffer.from(res.data, "binary");

      // Detectar tipo
      const esVideo = contentType.includes("video") || mediaUrl.endsWith(".mp4");
      const esGif = contentType.includes("gif") || mediaUrl.endsWith(".gif");

      // Decoraciones aleatorias
      const decoraciones = [
        "🌸✨💫🎬", "🎥🌈🌺🩵", "💞🌸🎶🌟", "🎬🩷🌼🌠", "🌸🎞️💫🎀"
      ];
      const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];

      const caption = `${deco}\n*🌸 Anime Clip Aleatorio 🌸*\n${deco}\n\n🎞️ Disfruta del ritmo y la magia del anime 💫`;

      // Enviar según tipo
      if (esVideo || esGif) {
        await sock.sendMessage(chat, {
          video: buffer,
          mimetype: "video/mp4",
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chat, {
          image: buffer,
          caption
        }, { quoted: msg });
      }

    } catch (err) {
      console.error("⚠️ Error al enviar el clip:", err.message);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al enviar el clip. Intenta de nuevo." }, { quoted: msg });
    }
  }
};

export default animeclipCommand;
