import fetch from 'node-fetch';
import baileys from '@whiskeysockets/baileys';

// Helper function to send an album of media
async function sendAlbumMessage(sock, jid, medias, options = {}) {
    if (typeof jid !== "string") throw new TypeError(`jid must be a string, received: ${jid}`);
    if (medias.length < 2) throw new RangeError("At least 2 images are required for an album.");

    const caption = options.caption || "";
    const delay = !isNaN(options.delay) ? options.delay : 500;
    delete options.caption;
    delete options.delay;

    // Generate the initial album message
    const album = baileys.generateWAMessageFromContent(
        jid,
        { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
        {}
    );

    // Relay the album creation message
    await sock.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    // Send each image in the album
    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const img = await baileys.generateWAMessage(
            album.key.remoteJid,
            // Add caption only to the first image
            { [type]: data, ...(i === 0 ? { caption } : {}) },
            { upload: sock.waUploadToServer }
        );

        // Associate the image with the created album
        img.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key },
        };

        await sock.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
        await baileys.delay(delay);
    }
    return album;
}

const pinterestCommand = {
    name: 'pinterest',
    category: 'descargas',
    description: 'Busca imágenes en Pinterest y las envía como un álbum.',
    aliases: ['pin'],

    async execute({ sock, msg, args }) {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(msg.key.remoteJid, { text: `❀ Por favor, ingresa lo que deseas buscar en Pinterest.` }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: '✧ *Buscando y descargando imágenes de Pinterest...*' }, { quoted: msg });

        try {
            const res = await fetch(`https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(text)}`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length < 2) {
                return sock.sendMessage(msg.key.remoteJid, { text: '✧ No se encontraron suficientes imágenes para crear un álbum.' }, { quoted: msg });
            }

            // Prepare images for the album, taking up to 10
            const images = data.slice(0, 10).map(img => ({ type: "image", data: { url: img.image_large_url } }));

            const caption = `❀ *Resultados de Búsqueda para:* ${text}\n⌦ Powered by Gura 🦈`;

            // Use the adapted helper function to send the album
            await sendAlbumMessage(sock, msg.key.remoteJid, images, { caption });

            await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

        } catch (error) {
            console.error("Error in Pinterest command:", error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠︎ Hubo un error al obtener las imágenes de Pinterest.' }, { quoted: msg });
        }
    }
};

export default pinterestCommand;