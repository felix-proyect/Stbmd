import fetch from 'node-fetch';

const IA_API_KEY = '22f66JK9VLbTZVgC8chFAYRA';

const iaCommand = {
  name: "ia",
  category: "buscador",
  description: "Realiza una búsqueda con el modo IA de Google.",
  aliases: ["ask", "ai"],

  async execute({ sock, msg, args }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `🤖 Por favor, proporciona un texto para la IA.`
      }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🤔', key: msg.key } });

    try {
      const apiUrl = `https://www.searchapi.io/api/v1/search?engine=google_ai_mode&q=${encodeURIComponent(query)}&api_key=${IA_API_KEY}`;
      const res = await fetch(apiUrl);
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.answer_box) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ La IA no proporcionó un cuadro de respuesta.'
        }, { quoted: msg });
      }

      const answer = json.answer_box.answer;
      const markdown = json.answer_box.generated_markdown;

      if (!answer && !markdown) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ No se pudo obtener una respuesta de la IA.'
        }, { quoted: msg });
      }

      let replyMessage = '';
      if (answer) {
        replyMessage = answer;
      } else if (markdown) {
        replyMessage = markdown.replace(/(\*\*|`)/g, (match) => {
            if (match === '**') return '*'; // Convert bold to italic for WhatsApp
            return ''; // Remove backticks
        });
      }

      // Enviar resultado
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg });

    } catch (error) {
      console.error('Error en el comando IA:', error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Ocurrió un error al contactar a la IA. Inténtalo de nuevo más tarde.`
      }, { quoted: msg });
    }
  }
};

export default iaCommand;