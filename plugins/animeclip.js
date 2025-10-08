import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const animeclipCommand = {
  name: "animeclip",
  category: "diversion",
  description: "Envía un clip, GIF o imagen de anime aleatorio.",
  aliases: ["clip", "animevideo", "animeimg"],

  async execute({ sock, msg }) {
    const chat = msg.key.remoteJid;
    await sock.sendMessage(chat, { text: "🎬 *Buscando un clip de anime...* 🌸" }, { quoted: msg });

    const apis = [
      "https://api.waifu.pics/sfw/dance",
      "https://api.waifu.pics/sfw/wink",
      "https://api.waifu.pics/sfw/happy",
      "https://api.waifu.pics/sfw/cringe",
      "https://nekos.best/api/v2/dance",
      "https://nekos.best/api/v2/wave",
      "https://api.otakugifs.xyz/gif?reaction=dance",
      "https://api.otakugifs.xyz/gif?reaction=smile",
      "https://kawaii.red/api/gif/wave/tokenfree",
      "https://api.waifu.im/sfw/waifu"
    ];

    let mediaUrl = null;
    let mediaType = null; // "video", "gif" o "image"

    // Buscar URL válida en las APIs
    for (const api of apis.sort(() => Math.random() - 0.5)) {
      try {
        const res = await axios.get(api, { timeout: 15000 });
        const urls = [
          res.data?.url,
          res.data?.response?.url,
          res.data?.results?.[0]?.url,
          res.data?.data?.[0]?.url,
          res.data?.gif,
          res.data?.images?.[0]?.url
        ].filter(Boolean);
        const found = urls.find(u => /\.(mp4|gif|jpe?g|png)$/i.test(u));
        if (found) {
          mediaUrl = found;
          if (/\.mp4$/i.test(found)) mediaType = "video";
          else if (/\.gif$/i.test(found)) mediaType = "gif";
          else mediaType = "image";
          break;
        }
      } catch (err) {
        console.log("❌ Falló API:", api);
      }
    }

    if (!mediaUrl) {
      return sock.sendMessage(chat, { text: "🚫 No se encontró ningún clip en este momento." }, { quoted: msg });
    }

    try {
      const response = await axios.get(mediaUrl, { responseType: "arraybuffer", timeout: 30000 });
      const buffer = Buffer.from(response.data, "binary");

      const decoraciones = ["🌸✨💫🎬", "🎥🌈🌺🩵", "💞🌸🎶🌟", "🎬🩷🌼🌠", "🌸🎞️💫🎀"];
      const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];
      const caption = `${deco}\n*🌸 Anime Aleatorio 🌸*\n${deco}\n\n🎞️ Disfruta del anime 💫`;

      if (mediaType === "video") {
        await sock.sendMessage(chat, { video: buffer, mimetype: "video/mp4", caption }, { quoted: msg });
      } else if (mediaType === "gif") {
        // Convertir GIF a MP4 temporalmente
        const tempInput = path.join(__dirname, "temp_input.gif");
        const tempOutput = path.join(__dirname, "temp_output.mp4");
        fs.writeFileSync(tempInput, buffer);

        await new Promise((resolve, reject) => {
          exec(`ffmpeg -y -i "${tempInput}" -movflags faststart -pix_fmt yuv420p -vf scale=512:-1 "${tempOutput}"`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        const finalBuffer = fs.readFileSync(tempOutput);
        await sock.sendMessage(chat, { video: finalBuffer, mimetype: "video/mp4", caption }, { quoted: msg });

        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
      } else {
        await sock.sendMessage(chat, { image: buffer, mimetype: "image/jpeg", caption }, { quoted: msg });
      }

    } catch (err) {
      console.error("⚠️ Error al enviar el clip:", err.message);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al enviar el clip. Intenta de nuevo." }, { quoted: msg });
    }
  }
};

export default animeclipCommand;
