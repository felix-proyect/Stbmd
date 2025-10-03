import axios from 'axios';

// Obtener token y cookies desde la web de tmate
async function obtenerTokenYCookie() {
  const res = await axios.get('https://tmate.cc/id', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i);
  const token = tokenMatch?.[1];
  if (!token) throw new Error('No se encontró el token para la descarga');
  return { token, cookie };
}

// Descargar video o imagen desde TikTok
async function descargarDeTikTok(urlTikTok) {
  const { token, cookie } = await obtenerTokenYCookie();
  const params = new URLSearchParams();
  params.append('url', urlTikTok);
  params.append('token', token);

  const res = await axios.post('https://tmate.cc/action', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://tmate.cc/id',
      'Origin': 'https://tmate.cc',
      'Cookie': cookie
    }
  });

  const html = res.data?.data;
  if (!html) throw new Error('No se recibió ningún dato del servidor de descarga');

  const tituloMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const titulo = tituloMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Sin título';

  const coincidencias = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)];
  const vistos = new Set();
  const enlaces = coincidencias
    .map(([_, href, etiqueta]) => ({ href, label: etiqueta.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !vistos.has(href) && vistos.add(href));

  const enlacesMp4 = enlaces.filter(v => /download without watermark/i.test(v.label));
  const enlaceMp3 = enlaces.find(v => /download mp3 audio/i.test(v.label));

  if (enlacesMp4.length > 0) {
    return { type: 'video', title: titulo, mp4Links: enlacesMp4, mp3Link: enlaceMp3 };
  }

  const coincidenciasImg = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)];
  const imagenes = [...new Set(coincidenciasImg.map(m => m[1]))];

  if (imagenes.length > 0) {
    return { type: 'image', title: titulo, images: imagenes, mp3Link: enlaceMp3 };
  }

  throw new Error('No se encontró un video o imágenes descargables en el enlace proporcionado.');
}

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga videos o imágenes de TikTok sin marca de agua.",
  aliases: ['ttdl', 'tt'],

  async execute({ conn, msg, text, usedPrefix, command }) {
    if (!text) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: `😕 Por favor, proporciona un enlace de TikTok.\n\nEjemplo: *${usedPrefix + command}* https://vt.tiktok.com/abcd/`
      }, { quoted: msg });
    }

    // Regex to find URL in text
    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) {
        return conn.sendMessage(msg.key.remoteJid, { text: "No se encontró un enlace válido en el mensaje." }, { quoted: msg });
    }
    const url = urlMatch[0];

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });
      const resultado = await descargarDeTikTok(url);

      if (resultado.type === 'video') {
        await sock.sendMessage(msg.key.remoteJid, {
          video: { url: resultado.mp4Links[0].href },
          caption: `🎬 *Descargador de Videos de TikTok*\n🎧 *Título:* ${resultado.title}`
        }, { quoted: msg });
      } else if (resultado.type === 'image') {
        for (let i = 0; i < resultado.images.length; i++) {
          await sock.sendMessage(msg.key.remoteJid, {
            image: { url: resultado.images[i] },
            caption: `🖼️ *Imagen ${i + 1} de ${resultado.images.length}*\n📌 *Título:* ${resultado.title}`
          }, { quoted: msg });
        }
      }

      if (resultado.mp3Link) {
        await sock.sendMessage(msg.key.remoteJid, {
          document: { url: resultado.mp3Link.href },
          fileName: `${resultado.title}.mp3`,
          mimetype: 'audio/mpeg'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✨", key: msg.key } });

    } catch (e) {
      console.error("Error in tiktok command:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⛔️", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `😔 Vaya, falló la descarga desde TikTok.\n> \`${e.message}\`\n\nIntenta con otro enlace.`
      }, { quoted: msg });
    }
  }
};

export default tiktokCommand;