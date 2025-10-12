import axios from "axios";
import fetch from "node-fetch";
import crypto from "crypto";
const jimp = (await import('jimp')).default;
import config from "../config.js";

// ==================== TODAS LAS APIS ==================== //
const fuentes = [
  // 🔹 ZenzzXD
  { api: 'ZenzzXD', endpoint: url => `https://api.zenzxz.my.id/downloader/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.download_url },
  { api: 'ZenzzXD v2', endpoint: url => `https://api.zenzxz.my.id/downloader/ytmp3v2?url=${encodeURIComponent(url)}`, extractor: res => res?.download_url },
  // 🔹 Vreden
  { api: 'Vreden', endpoint: url => `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.result?.download?.url },
  // 🔹 Delirius
  { api: 'Delirius', endpoint: url => `https://api.delirius.my.id/download/ymp3?url=${encodeURIComponent(url)}`, extractor: res => res?.data?.download?.url },
  // 🔹 StarVoid
  { api: 'StarVoid', endpoint: url => `https://api.starvoidclub.xyz/download/youtube?url=${encodeURIComponent(url)}`, extractor: res => res?.audio },
  // 🔹 Otras repetidas / variantes
  { api: 'Vreden 2', endpoint: url => `https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.result?.download?.url },
  { api: 'Delirius clone', endpoint: url => `https://api.delirius.store/download/ymp3?url=${encodeURIComponent(url)}`, extractor: res => res?.data?.download?.url },
  { api: 'Siputzx', endpoint: url => `https://api.siputzx.my.id/downloader/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.download_url },
  { api: 'Yupra', endpoint: url => `https://api.yupra.my.id/downloader/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.result?.download?.url },
  { api: 'Xyro', endpoint: url => `https://xyro.site/api/ytdl/audio?url=${encodeURIComponent(url)}`, extractor: res => res?.url },
  { api: 'Delirius V2', endpoint: url => `https://api.delirius.my.id/download/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res?.data?.download?.url },
  { api: 'StarVoid v2', endpoint: url => `https://api.starvoidclub.xyz/download/youtube?url=${encodeURIComponent(url)}`, extractor: res => res?.audio }
];

// ==================== SAVE TUBE (BACKUP FINAL) ==================== //
const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download"
  },
  headers: {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://yt.savetube.me',
    'referer': 'https://yt.savetube.me/',
    'user-agent': 'MiyukiBot/1.0.0'
  },
  crypto: {
    hexToBuffer: hex => Buffer.from(hex.match(/.{1,2}/g).join(''), 'hex'),
    decrypt: async enc => {
      const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
      const data = Buffer.from(enc, 'base64');
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString());
    }
  },
  youtubeId: url => {
    const r = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (let regex of r) if (regex.test(url)) return url.match(regex)[1];
    return null;
  },
  request: async (endpoint, data = {}, method = 'post') => {
    try {
      const { data: res } = await axios({
        method,
        url: `${endpoint.startsWith('http') ? '' : savetube.api.base}${endpoint}`,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: savetube.headers
      });
      return { ok: true, data: res };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  getCDN: async () => {
    const res = await savetube.request(savetube.api.cdn, {}, 'get');
    if (!res.ok) return res;
    return { ok: true, cdn: res.data.cdn };
  },
  download: async (url) => {
    try {
      const id = savetube.youtubeId(url);
      if (!id) throw new Error('No ID de YouTube válido');

      const cdnRes = await savetube.getCDN();
      if (!cdnRes.ok) throw new Error('CDN falló');

      const infoRes = await savetube.request(`https://${cdnRes.cdn}${savetube.api.info}`, { url });
      const decrypted = await savetube.crypto.decrypt(infoRes.data.data);

      const dl = await savetube.request(`https://${cdnRes.cdn}${savetube.api.download}`, {
        id,
        downloadType: 'audio',
        quality: '128',
        key: decrypted.key
      });

      return {
        ok: true,
        url: dl.data.data.downloadUrl,
        title: decrypted.title,
        thumbnail: decrypted.thumbnail
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
};

const playvipCommand = {
  name: 'playvip',
  category: 'descargas',
  help: ['playvip'],
  tags: ['descargas'],
  command: /^playvip$/i,

  async execute({ conn, args, m }) {
    const cost = 10;
    let user = global.db.data.users[m.sender];
    if (user.coin < cost) {
      return conn.sendMessage(m.chat, { text: `🪙 *No tienes suficientes coins para usar este comando.* Necesitas ${cost} coins.` }, { quoted: m });
    }

    const query = args.join(" ").trim();
    if (!query)
      return conn.sendMessage(m.chat, {
        text: `🎵 *Ingresa el nombre del audio o canción que deseas descargar.*`
      }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: '🔎', key: m.key } });
    await conn.sendMessage(m.chat, { text: `🔍 *Buscando en YouTube...*\n⏳ Por favor espera...` }, { quoted: m });

    try {
      // Buscar en YouTube
      const res = await fetch(`https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!json.status || !json.data?.length)
        return conn.sendMessage(m.chat, { text: `❌ No encontré resultados para *${query}*.` }, { quoted: m });

      const vid = json.data[0];
      await conn.sendMessage(m.chat, { react: { text: '🎧', key: m.key } });
      await conn.sendMessage(m.chat, { text: `🎶 *Descargando:* ${vid.title}` }, { quoted: m });

      // Ejecutar TODAS las APIs simultáneamente
      const results = await Promise.allSettled(
        fuentes.map(async f => {
          try {
            const r = await fetch(f.endpoint(vid.url));
            const data = await r.json();
            const link = f.extractor(data);
            if (link) return link;
          } catch { }
          return null;
        })
      );

      // Elegir el primer link válido
      let dlUrl = results.find(r => r.status === 'fulfilled' && r.value)?.value;

      // Si ninguna funcionó, usar SaveTube
      if (!dlUrl) {
        const st = await savetube.download(vid.url);
        if (st.ok) dlUrl = st.url;
      }

      if (!dlUrl)
        return conn.sendMessage(m.chat, { text: `⚠️ *No se pudo obtener el audio, todas las APIs fallaron.*` }, { quoted: m });

      user.coin -= cost;

      // Miniatura
      let thumb = null;
      try {
        const img = await jimp.read(vid.thumbnail);
        img.resize(300, jimp.AUTO);
        thumb = await img.getBufferAsync(jimp.MIME_JPEG);
      } catch { }

      // Enviar audio
      await conn.sendMessage(m.chat, {
        audio: { url: dlUrl },
        mimetype: 'audio/mpeg',
        fileName: `${vid.title}.mp3`,
        caption: `
🎶 *${vid.title}*
🕒 Duración: ${vid.duration}
🎤 Canal: ${vid.author?.name || "Desconocido"}
🔗 Link: ${vid.url}

*Costo: -${cost} coins*
`.trim(),
        ...(thumb ? { jpegThumbnail: thumb } : {}),
      }, { quoted: m });

      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error(e);
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      conn.sendMessage(m.chat, { text: `⚠️ Error: ${e.message}` }, { quoted: m });
    }
  }
};

export default playvipCommand;