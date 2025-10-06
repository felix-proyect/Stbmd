import axios from 'axios';
import StickerFormatter from 'wa-sticker-formatter';
const { Sticker, StickerTypes } = StickerFormatter;

const bratCommand = {
  name: "brat",
  category: "sticker",
  description: "Crea un sticker con un texto y un estilo particular.",
  aliases: [],

  async execute({ sock, msg, args, usedPrefix, command, config }) {
    const from = msg.key.remoteJid;
    const inputText = args.join(' ') || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || '';

    if (!inputText.trim()) {
      return sock.sendMessage(from, { text: `❌ Por favor, proporciona un texto.\n\n*Ejemplo:*\n*${usedPrefix + command}* Hola Mundo` }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    try {
      const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(inputText)}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');

      if (!imageBuffer) {
        throw new Error("La API no devolvió una imagen válida.");
      }

      const sticker = new Sticker(imageBuffer, {
        pack: config.botName || 'Yupra',
        author: config.ownerName || 'Brat',
        type: StickerTypes.FULL,
        quality: 80
      });

      const stickerMessage = await sticker.toMessage();
      await sock.sendMessage(from, stickerMessage, { quoted: msg });
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando 'brat':", error);
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(from, { text: `Gagal membuat sticker: ${error.message}` }, { quoted: msg });
    }
  }
};

export default bratCommand;