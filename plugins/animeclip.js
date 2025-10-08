import axios from "axios";

const animeclipCommand = {
  name: "animeclip",
  category: "diversion",
  description: "Envía un clip o GIF de anime aleatorio.",
  aliases: ["clip", "animevideo"],

  async execute({ sock, msg }) {
    const chat = msg.key.remoteJid;
    await sock.sendMessage(chat, { text: "🎬 *Buscando un clip de anime...* 🌸" }, { quoted: msg });

    // 🌐 APIs públicas (solo las que pueden devolver videos o GIFs)
    const apis = [
      "https://api.waifu.pics/sfw/dance",
      "https://api.waifu.pics/sfw/wink",
      "https://api.waifu.pics/sfw/waifu",
      "https://nekos.best/api/v2/dance",
      "https://api.nekos.dev/api/v3/images/sfw/gif/dance",
      "https://kawaii.red/api/gif/dance/tokenfree",
      "https://nekos.best/api/v2/wave",
      "https://api.waifu.pics/sfw/happy"
    ];

    let mediaUrl = null;

    // 🌀 Intentar obtener un video o gif válido de varias APIs
    for (const api of apis.sort(() => Math.random() - 0.5)) {
      try {
        const res = await axios.get(api, { timeout: 15000 });

        // Buscamos la URL en varias estructuras posibles
        const urlCandidates = [
          res.data?.url,
          res.data?.results?.[0]?.url,
          res.data?.data?.[0]?.url,
          res.data?.response?.[0]?.url
        ].filter(Boolean);

        const foundUrl = urlCandidates.find(u => /\.(mp4|gif)$/i.test(u));
        if (foundUrl) {
          mediaUrl = foundUrl;
          break;
        }
      } catch (err) {
        console.log(`❌ API fallida: ${api}`);
      }
    }

    if (!mediaUrl) {
      return sock.sendMessage(chat, { text: "🚫 No se pudo encontrar un video o GIF de anime en este momento." }, { quoted: msg });
    }

    try {
      const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      });

      const contentType = response.headers["content-type"];
      const isVideo = contentType?.startsWith("video/");
      const isGif = contentType?.includes("gif");

      if (!isVideo && !isGif) {
        throw new Error("El archivo no es un video ni un gif válido.");
      }

      const buffer = Buffer.from(response.data, "binary");

      // 🌸 Decoraciones aleatorias
      const decoraciones = [
        "🌸✨💫🎬",
        "🎥🌈🌺🩵",
        "💞🌸🎶🌟",
        "🎬🩷🌼🌠",
        "🌸🎞️💫🎀"
      ];
      const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];

      const caption = `${deco}\n*🌸 Anime Clip Aleatorio 🌸*\n${deco}\n\n🎞️ Disfruta del ritmo y la magia del anime 💫`;

      // 🎥 Enviar el video o gif según el tipo
      if (isVideo) {
        await sock.sendMessage(chat, {
          video: buffer,
          mimetype: "video/mp4",
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chat, {
          image: buffer,
          caption,
          mimetype: "image/gif"
        }, { quoted: msg });
      }

    } catch (err) {
      console.error("⚠️ Error al enviar el clip:", err);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al obtener el clip. Intenta nuevamente." }, { quoted: msg });
    }
  },
};

export default animeclipCommand;
