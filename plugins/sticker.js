import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import axios from 'axios';

// Función para validar si un texto es una URL de imagen/video válida
function isUrl(text) {
    return /^https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(text);
}

const stickerCommand = {
  name: "sticker",
  category: "utilidades",
  description: "Convierte una imagen, video o URL en un sticker. Opcional: `sticker <pack> | <autor>`",
  aliases: ["s", "stiker"],

  async execute({ sock, msg, args, config }) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.join(' ');

    let packname = config.botName || 'Bot';
    let author = config.ownerName || 'Jules';

    if (text.includes('|')) {
        [packname, author] = text.split('|').map(s => s.trim());
    }

    let mediaMessage;
    let buffer;
    let source = null; // Para un mejor manejo de errores

    // Prioridad 1: Mensaje citado
    if (quoted) {
        mediaMessage = quoted;
        source = 'quoted message';
    }
    // Prioridad 2: Mensaje con imagen/video
    else if (msg.message?.imageMessage || msg.message?.videoMessage) {
        mediaMessage = msg.message;
        source = 'direct message';
    }
    // Prioridad 3: URL en los argumentos
    else if (args[0] && isUrl(args[0])) {
        source = 'url';
    }

    if (!source) {
        return sock.sendMessage(from, { text: "Responde a una imagen/video, o envía una URL, para crear un sticker." }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: "🎨", key: msg.key } });

    try {
        if (source === 'quoted message' || source === 'direct message') {
            if (mediaMessage.videoMessage && mediaMessage.videoMessage.seconds > 10) {
                return sock.sendMessage(from, { text: "El video es demasiado largo. El límite es de 10 segundos." }, { quoted: msg });
            }
            const stream = await downloadContentFromMessage(mediaMessage.imageMessage || mediaMessage.videoMessage, mediaMessage.imageMessage ? 'image' : 'video');
            buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
        } else if (source === 'url') {
            const url = args[0];
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = response.data;
        }

        if (!buffer) {
            throw new Error("No se pudo obtener el buffer del medio.");
        }

        const sticker = new Sticker(buffer, {
            pack: packname,
            author: author,
            type: StickerTypes.FULL,
            quality: 50
        });

        // La nueva versión puede requerir .toMessage() para compatibilidad con Baileys
        const stickerMessage = await sticker.toMessage();
        await sock.sendMessage(from, stickerMessage);

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (e) {
        console.error("Error en el comando sticker:", e);
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        await sock.sendMessage(from, { text: `Ocurrió un error al crear el sticker. Detalles: ${e.message}` }, { quoted: msg });
    }
  }
};

export default stickerCommand;
