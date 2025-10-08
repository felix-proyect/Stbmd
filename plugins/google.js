import fetch from 'node-fetch';

const googleCommand = {
  name: "google",
  category: "buscador",
  description: "Realiza una búsqueda en Google usando APIs gratuitas.",
  aliases: ["search"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `🐇 Por favor, proporciona un término para buscar en Google.` 
      }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });

    // Intenta primero con Popcat API, si falla usa Akuari
    const apis = [
      `https://api.popcat.xyz/google?q=${encodeURIComponent(query)}`,
      `https://api.akuari.my.id/search/google?q=${encodeURIComponent(query)}`
    ];

    let results = null;

    for (let api of apis) {
      try {
        const res = await fetch(api);
        const json = await res.json();

        if (json && json.results && json.results.length > 0) {
          results = json.results.map(r => ({
            title: r.title || r.judul || "Sin título",
            link: r.url || r.link || "",
            desc: r.description || r.desc || ""
          }));
          break;
        }
      } catch {
        continue;
      }
    }

    if (!results || results.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      return sock.sendMessage(msg.key.remoteJid, { 
        text: '⚠️ No se encontraron resultados o las APIs fallaron.' 
      }, { quoted: msg });
    }

    // Construir el mensaje
    let replyMessage = `*「 🔎 」 Resultados de Google para: "${query}"*\n\n`;
    results.slice(0, 8).forEach((item, index) => {
      replyMessage += `*${index + 1}. ${item.title}*\n`;
      replyMessage += `_${item.desc || 'Sin descripción'}_\n`;
      replyMessage += `*Enlace:* ${item.link}\n\n`;
    });

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
    await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg });
  }
};

export default googleCommand;
