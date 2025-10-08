import axios from "axios";

const animeclipCommand = {
  name: "animeclip",
  category: "diversion",
  description: "Envía un clip o gif de anime al azar.",
  aliases: ["clip", "animevideo"],

  async execute({ sock, msg }) {
    const chat = msg.key.remoteJid;

    // Mensaje inicial
    await sock.sendMessage(chat, { text: "🌸 *Invocando un clip de anime mágico...* 🎬✨" }, { quoted: msg });

    // APIs públicas sin necesidad de clave
    const apis = [
      "https://api.waifu.pics/sfw/dance",
      "https://nekos.best/api/v2/dance",
      "https://api.nekos.dev/api/v3/images/sfw/gif/dance",
      "https://kawaii.red/api/gif/dance/tokenfree",
      "https://api.waifu.im/search/?included_tags=dance",
      "https://v1.api-ninjas.com/v1/randomimage?category=anime"
    ];

    let videoUrl = null;

    // Probar cada API hasta encontrar una que funcione
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 15000 });

        if (res.data?.url) videoUrl = res.data.url;
        else if (res.data?.results?.[0]?.url) videoUrl = res.data.results[0].url;
        else if (res.data?.data?.[0]?.url) videoUrl = res.data.data[0].url;
        else if (res.data?.response?.[0]?.url) videoUrl = res.data.response[0].url;
        else if (res.data?.image) videoUrl = res.data.image;

        if (videoUrl) break;
      } catch (err) {
        console.log(`⚠️ Falló la API: ${api}`);
      }
    }

    if (!videoUrl) {
      return sock.sendMessage(chat, { text: "🚫 *No se pudo obtener un clip de anime.* Intenta de nuevo más tarde." }, { quoted: msg });
    }

    try {
      const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
      const contentType = response.headers["content-type"];
      const buffer = Buffer.from(response.data, "binary");

      // Decoración del mensaje final
      const decoraciones = [
        "🌸✨💫🎬",
        "🎥🌈🌺🩵",
        "💞🌸🎶🌟",
        "🎬🩷🌼🌠",
        "🌸🎞️💫🎀"
      ];
      const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];

      const caption = `${deco}\n*AnimeClip Aleatorio*\n${deco}\n\n🩵 Disfruta de este hermoso momento de anime.\n🌸`;

      if (contentType.startsWith("video/")) {
        await sock.sendMessage(
          chat,
          {
            video: buffer,
            mimetype: "video/mp4",
            caption
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          chat,
          {
            image: buffer,
            caption
          },
          { quoted: msg }
        );
      }
    } catch (err) {
      console.error("Error al enviar el clip:", err);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al descargar el clip. Inténtalo nuevamente." }, { quoted: msg });
    }
  },
};

export default animeclipCommand;
