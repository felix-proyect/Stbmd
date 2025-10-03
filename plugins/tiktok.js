import axios from 'axios';

// --- API 1: delirius-apiofc ---
async function downloadWithApi1(url) {
  console.log("Intentando con API 1: delirius-apiofc");
  const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl);

  if (!data.status || !data.data || !data.data.meta?.media) {
    throw new Error("API 1: No se encontró video o la respuesta es inválida.");
  }

  const videoUrl = data.data.meta.media.find(v => v.type === "video")?.org;
  if (!videoUrl) {
    throw new Error("API 1: No se encontró URL del video en la respuesta.");
  }

  const { title, author, like, comment, share } = data.data;
  const caption = `*${author.nickname}* (@${author.username})\n\n` +
                  `*Título:* ${title || 'Sin título'}\n` +
                  `*Likes:* ${like} | *Comentarios:* ${comment} | *Compartidos:* ${share}`;

  return { videoUrl, caption };
}

// --- API 2: bk9.fun ---
async function downloadWithApi2(url) {
  console.log("Intentando con API 2: bk9.fun");
  const { data } = await axios.get(`https://bk9.fun/download/tiktok2?url=${encodeURIComponent(url)}`);

  if (!data?.status || !data.BK9?.video?.noWatermark) {
    throw new Error("API 2: No se encontró video o la respuesta es inválida.");
  }

  const videoUrl = data.BK9.video.noWatermark;
  const caption = `Video de TikTok descargado (Fuente 2).`;

  return { videoUrl, caption };
}

// --- API 3: jawad-tech ---
async function downloadWithApi3(url) {
  console.log("Intentando con API 3: jawad-tech");
  const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl);

  if (!data.status || !data.result || !data.result.length) {
    throw new Error("API 3: No se encontró video o la respuesta es inválida.");
  }

  const videoUrl = data.result[0];
  const meta = data.metadata || {};
  const author = meta.author || "Desconocido";
  const captionText = meta.caption ? meta.caption.slice(0, 100) + "..." : "Sin descripción.";
  const caption = `*Autor:* ${author}\n*Descripción:* ${captionText}`;

  return { videoUrl, caption };
}

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga videos de TikTok sin marca de agua usando múltiples APIs.",
  aliases: ['ttdl', 'tt'],

  async execute({ sock, msg, text, usedPrefix, command }) {
    if (!text || !text.includes("tiktok.com")) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace de TikTok válido.\n\nEjemplo: *${usedPrefix + command}* https://vt.tiktok.com/abcd/`
      }, { quoted: msg });
    }

    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró un enlace válido en el mensaje." }, { quoted: msg });
    }
    const url = urlMatch[0];

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

    const downloaders = [
      downloadWithApi1,
      downloadWithApi2,
      downloadWithApi3,
    ];

    for (let i = 0; i < downloaders.length; i++) {
      try {
        const result = await downloaders[i](url);

        await sock.sendMessage(msg.key.remoteJid, {
          video: { url: result.videoUrl },
          caption: result.caption,
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
        return; // Success, exit the loop
      } catch (e) {
        console.warn(`El descargador ${i + 1} falló:`, e.message);
        // Continue to the next downloader
      }
    }

    // If all downloaders failed
    console.error("Todos los descargadores de TikTok fallaron para la URL:", url);
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
    await sock.sendMessage(msg.key.remoteJid, {
      text: `😔 Lo siento, no pude descargar el video de TikTok desde ninguna de las fuentes disponibles. Por favor, intenta más tarde.`
    }, { quoted: msg });
  }
};

export default tiktokCommand;