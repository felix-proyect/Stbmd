import axios from 'axios';

const hollowKnightCommand = {
  name: "hollowknight",
  category: "informacion",
  description: "Responde preguntas sobre Hollow Knight, busca en la wiki y envía un screenshot.",
  aliases: ["hk", "hollow", "hkinfo"],

  async execute({ sock, msg, args }) {
    const chat = msg.key.remoteJid;
    const question = args.join(' ');

    if (!question) {
      return sock.sendMessage(chat, { text: "❌ Por favor, escribe tu pregunta sobre Hollow Knight." }, { quoted: msg });
    }

    await sock.sendMessage(chat, { text: "🤖 Consultando IA y wiki de Hollow Knight..." }, { quoted: msg });

    try {
      // 1️⃣ Google AI Mode API
      const aiRes = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_ai_mode',
          q: `Hollow Knight: ${question}`,
          api_key: '22f66JK9VLbTZVgC8chFAYRA'
        }
      });

      const aiAnswer = aiRes.data?.answers?.[0]?.answer || "No encontré información directa usando IA.";

      // 2️⃣ Buscar en la Wiki de Hollow Knight
      const wikiRes = await axios.get('https://hollowknight.fandom.com/wiki/Special:Search', {
        params: { query: question }
      });

      // Extraemos el primer link de búsqueda
      const wikiPageMatch = wikiRes.data.match(/href="(\/wiki\/[^"]+)"/);
      let wikiLink = wikiPageMatch ? `https://hollowknight.fandom.com${wikiPageMatch[1]}` : null;

      let wikiInfo = "";
      if (wikiLink) {
        // Obtenemos el contenido de la página
        const pageRes = await axios.get(wikiLink);
        const introMatch = pageRes.data.match(/<p>(.*?)<\/p>/);
        wikiInfo = introMatch ? introMatch[1].replace(/<[^>]*>/g, '') : "";
      }

      // 3️⃣ Screenshot de la página (ejemplo usando screenshotapi.net)
      let screenshotUrl = null;
      if (wikiLink) {
        const shotRes = await axios.get('https://shot.screenshotapi.net/screenshot', {
          params: {
            url: wikiLink,
            token: 'YOUR_SCREENSHOT_API_KEY', // Aquí tu API key de screenshotapi.net
            output: 'image',
            file_type: 'png'
          }
        });
        screenshotUrl = shotRes.data.screenshot;
      }

      // 4️⃣ Decoración del mensaje
      const bordersTop = "╭─🌌─╮";
      const bordersBottom = "╰─🌌─╯";
      const lineSep = "✨━━━━━━━━✨";

      let finalMessage = `
${bordersTop}
🎮 *Hollow Knight Info* 🎮
${lineSep}
💬 *Pregunta:* ${question}

🤖 *Respuesta IA:* ${aiAnswer}

📚 *Wiki info:* ${wikiInfo || "No se encontró información específica en la wiki."}

🔗 *Enlace Wiki:* ${wikiLink || "No disponible"}
${lineSep}
${bordersBottom}
`;

      await sock.sendMessage(chat, { text: finalMessage.trim() }, { quoted: msg });

      // Enviar screenshot si existe
      if (screenshotUrl) {
        const imgRes = await axios.get(screenshotUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(imgRes.data, "binary");
        await sock.sendMessage(chat, { image: buffer, caption: "📸 Screenshot de la Wiki" }, { quoted: msg });
      }

    } catch (error) {
      console.error("Error en Hollow Knight Command:", error);
      await sock.sendMessage(chat, { text: "⚠️ Hubo un error al obtener la información. Intenta de nuevo más tarde." }, { quoted: msg });
    }
  }
};

export default hollowKnightCommand;
