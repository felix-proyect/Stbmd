import fetch from 'node-fetch';

const lyricsCommand = {
  name: "lyrics",
  category: "herramientas",
  description: "Busca la letra de una canción usando una API mejorada.",
  aliases: ["letra"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de la canción para buscar su letra." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { text: `✍️ Buscando la letra de "${query}"...` }, { quoted: msg });

      const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);

      if (!res.ok) {
        // Si la API devuelve un error, lo notificamos.
        throw new Error(`La API de letras no pudo procesar la solicitud (status: ${res.status}).`);
      }

      const data = await res.json();
      const lyrics = data?.result?.lyrics;

      if (!lyrics) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Lo siento, no pude encontrar la letra para "${query}".` }, { quoted: msg });
        return;
      }

      // WhatsApp tiene un límite de caracteres, así que truncamos si es necesario.
      const maxChars = 4096;
      const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;
      const message = `📜 *Letra de ${query}*\n\n${output}`;

      await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });

    } catch (error) {
      console.error('Error en el comando lyrics:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al buscar la letra para "${query}".` }, { quoted: msg });
    }
  }
};

export default lyricsCommand;
