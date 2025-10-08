import fetch from 'node-fetch';
import { translate } from '@vitalets/google-translate-api';
import config from '../config.js';

async function translateText(text) {
  if (!text) return '';
  try {
    const { text: translated } = await translate(text, { to: 'es', raw: true });
    return translated;
  } catch (e) {
    console.error('Error during translation:', e);
    return text; // Fallback to original text on translation error
  }
}

const iaCommand = {
  name: "ia",
  category: "buscador",
  description: "Realiza una búsqueda con el modo IA de Google y traduce la respuesta al español.",
  aliases: ["ask", "ai"],

  async execute({ sock, msg, args }) {
    const IA_API_KEY = config.api.searchapi;
    if (!IA_API_KEY) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `🤖 La API key de SearchAPI no está configurada. Por favor, añádela en el archivo de configuración.`
      }, { quoted: msg });
    }

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

      const textBlocks = json.text_blocks;

      if (!textBlocks || textBlocks.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ No se pudo obtener una respuesta estructurada de la IA.'
        }, { quoted: msg });
      }

      let replyMessage = '';

      for (const block of textBlocks) {
        switch (block.type) {
          case 'header':
            replyMessage += `*${await translateText(block.answer)}*\n\n`;
            break;
          case 'paragraph':
            replyMessage += `${await translateText(block.answer)}\n\n`;
            break;
          case 'code_blocks':
            replyMessage += '```\n' + block.code + '\n```\n\n';
            break;
          case 'unordered_list':
            for (const item of block.items) {
                if (item.type === 'paragraph') {
                    replyMessage += `• ${await translateText(item.answer)}\n`;
                }
            }
            replyMessage += '\n';
            break;
        }
      }

      // Enviar resultado
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: replyMessage.trim() }, { quoted: msg,
        linkPreview: {
          'canonical-url': json.search_metadata.request_url,
          'matched-text': query,
          'title': `Respuesta de IA para: ${query}`,
          'description': 'Generado por SearchAPI.io',
        }
      });

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