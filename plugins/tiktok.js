import axios from 'axios'

async function obtenerTokenYCookie() {
  const res = await axios.get('https://tmate.cc/id', {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })

  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i)
  const token = tokenMatch?.[1]
  if (!token) throw new Error('*[❗] No se encontró el token*')

  return { token, cookie }
}

async function descargarTikTok(urlTikTok) {
  const { token, cookie } = await obtenerTokenYCookie()

  const params = new URLSearchParams()
  params.append('url', urlTikTok)
  params.append('token', token)

  const res = await axios.post('https://tmate.cc/action', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://tmate.cc/id',
      'Origin': 'https://tmate.cc',
      'Cookie': cookie
    }
  })

  const html = res.data?.data
  if (!html) throw new Error('*[❗] No se encontraron datos en la respuesta*')

  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  const titulo = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Sin título'

  const matches = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)]
  const vistos = new Set()
  const links = matches
    .map(([_, href, label]) => ({ href, label: label.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !vistos.has(href) && vistos.add(href))

  const enlacesMp4 = links.filter(v => /download without watermark/i.test(v.label))
  const enlaceMp3 = links.find(v => /download mp3 audio/i.test(v.label))

  if (enlacesMp4.length > 0) {
    return {
      tipo: 'video',
      titulo,
      enlacesMp4,
      enlaceMp3
    }
  }

  const imageMatches = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)]
  const enlacesImagenes = [...new Set(imageMatches.map(m => m[1]))]

  if (enlacesImagenes.length > 0) {
    return {
      tipo: 'imagen',
      titulo,
      imagenes: enlacesImagenes,
      enlaceMp3
    }
  }

  throw new Error('*[❗] No hubo respuesta, puede que el enlace sea incorrecto*')
}

let handler = async (m, { conn, args }) => {
  try {
    if (!args[0]) return m.reply('*[❗] Por favor, ingresa un enlace de TikTok...*')

    const url = args[0]
    if (!url.includes('tiktok.com')) return m.reply('*[❗] El enlace debe ser de TikTok*')

    m.reply('*⏳ Descargando, espera un momento...*')

    const resultado = await descargarTikTok(url)

    if (resultado.tipo === 'video') {
      if (resultado.enlacesMp4.length > 0) {
        const videoUrl = resultado.enlacesMp4[0].href

        await conn.sendMessage(m.chat, {
          video: { url: videoUrl }
        }, { quoted: m })

        if (resultado.enlaceMp3) {
          await conn.sendMessage(m.chat, {
            audio: { url: resultado.enlaceMp3.href }
          }, { quoted: m })
        }
      }
    } else if (resultado.tipo === 'imagen') {
      if (resultado.imagenes.length > 0) {
        for (let i = 0; i < resultado.imagenes.length; i++) {
          const imageUrl = resultado.imagenes[i]

          await conn.sendMessage(m.chat, {
            image: { url: imageUrl }
          }, { quoted: m })
        }

        if (resultado.enlaceMp3) {
          await conn.sendMessage(m.chat, {
            audio: { url: resultado.enlaceMp3.href }
          }, { quoted: m })
        }
      }
    }
  } catch (e) {
    m.reply(`⚠️ Error: ${e.message}`)
  }
}

handler.help = ['tiktok']
handler.command = ['tiktok', 'tt', 'tiktokdl']
handler.tags = ['downloader']

export default handler