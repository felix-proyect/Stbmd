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
  description: "Envía un clip o GIF de anime aleatorio (convertido a video válido).",
  aliases: ["clip", "animevideo"],

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
      "https://kawaii.red/api/gif/wave/tokenfree"
    ];

    let mediaUrl = null;

    for (const api of apis.sort(() => Math.random() - 0.5)) {
      try {
        const res = await axios.get(api, { timeout: 15000 });
        const urls = [
          res.data?.url,
          res.data?.response?.url,
          res.data?.results?.[0]?.url,
          res.data?.data?.[0]?.url,
          res.data?.gif
        ].filter(Boolean);
        const found = urls.find(u => /\.(mp4|gif)$/i.test(u));
        if (found) {
          mediaUrl = found;
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
      const contentType = response.headers["content-type"] || "";
      const buffer = Buffer.from(response.data, "binary");

      const tempInput = path.join(__dirname, "animeclip_input." + (mediaUrl.endsWith(".gif") ? "gif" : "mp4"));
      const tempOutput = path.join(__dirname, "animeclip_output.mp4");

      fs.writeFileSync(tempInput, buffer);

      const decoraciones = ["🌸✨💫🎬", "🎥🌈🌺🩵", "💞🌸🎶🌟", "🎬🩷🌼🌠", "🌸🎞️💫🎀"];
      const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];
      const caption = `${deco}\n*🌸 Anime Clip Aleatorio 🌸*\n${deco}\n\n🎞️ Disfruta del ritmo y la magia del anime 💫`;

      // Si es GIF, convertir a MP4
      if (mediaUrl.endsWith(".gif") || contentType.includes("gif")) {
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -y -i "${tempInput}" -movflags faststart -pix_fmt yuv420p -vf scale=512:-1 "${tempOutput}"`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        fs.renameSync(tempInput, tempOutput);
      }

      const finalBuffer = fs.readFileSync(tempOutput);

      await sock.sendMessage(chat, {
        video: finalBuffer,
        mimetype: "video/mp4",
        caption
      }, { quoted: msg });

      // Limpieza
      fs.unlinkSync(tempOutput);
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);

    } catch (err) {
      console.error("⚠️ Error al enviar el clip:", err.message);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al procesar el video. Intenta de nuevo." }, { quoted: msg });
    }
  }
};

export default animeclipCommand;
