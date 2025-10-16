import axios from 'axios';

async function obtenerTokenYCookie() {
  const res = await axios.get('https://tmate.cc/id', {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i);
  const token = tokenMatch?.[1];
  if (!token) throw new Error('*[❗] No se encontró el token*');

  return { token, cookie };
}

async function descargarTikTok(urlTikTok) {
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
  if (!html) throw new Error('*[❗] No se encontraron datos en la respuesta*');

  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const titulo = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Sin título';

  const matches = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)];
  const vistos = new Set();
  const links = matches
    .map(([_, href, label]) => ({ href, label: label.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !vistos.has(href) && vistos.add(href));

  const enlacesMp4 = links.filter(v => /download without watermark/i.test(v.label));
  const enlaceMp3 = links.find(v => /download mp3 audio/i.test(v.label));

  if (enlacesMp4.length > 0) {
    return {
      tipo: 'video',
      titulo,
      enlacesMp4,
      enlaceMp3
    };
  }

  const imageMatches = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)];
  const enlacesImagenes = [...new Set(imageMatches.map(m => m[1]))];

  if (enlacesImagenes.length > 0) {
    return {
      tipo: 'imagen',
      titulo,
      imagenes: enlacesImagenes,
      enlaceMp3
    };
  }

  throw new Error('*[❗] No hubo respuesta, puede que el enlace sea incorrecto*');
}

const tiktokCommand = {
  name: 'tiktok',
  category: 'descargas',
  description: 'Descarga videos o imágenes de TikTok sin marca de agua.',
  aliases: ['tt', 'tiktokdl'],

  async execute({ sock, msg, args }) {
    try {
      if (!args[0]) {
        return sock.sendMessage(msg.key.remoteJid, { text: '*[❗] Por favor, ingresa un enlace de TikTok...*' }, { quoted: msg });
      }

      const url = args[0];
      if (!url.includes('tiktok.com')) {
        return sock.sendMessage(msg.key.remoteJid, { text: '*[❗] El enlace debe ser de TikTok*' }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

      const resultado = await descargarTikTok(url);

      if (resultado.tipo === 'video') {
        if (resultado.enlacesMp4.length > 0) {
          const videoUrl = resultado.enlacesMp4[0].href;

          await sock.sendMessage(msg.chat, {
            video: { url: videoUrl }
          }, { quoted: msg });

          if (resultado.enlaceMp3) {
            await sock.sendMessage(msg.chat, {
              audio: { url: resultado.enlaceMp3.href }
            }, { quoted: msg });
          }
        }
      } else if (resultado.tipo === 'imagen') {
        if (resultado.imagenes.length > 0) {
          for (let i = 0; i < resultado.imagenes.length; i++) {
            const imageUrl = resultado.imagenes[i];

            await sock.sendMessage(msg.chat, {
              image: { url: imageUrl }
            }, { quoted: msg });
          }

          if (resultado.enlaceMp3) {
            await sock.sendMessage(msg.chat, {
              audio: { url: resultado.enlaceMp3.href }
            }, { quoted: msg });
          }
        }
      }
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error: ${e.message}` }, { quoted: msg });
    }
  }
};

export default tiktokCommand;