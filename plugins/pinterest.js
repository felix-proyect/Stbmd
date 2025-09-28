import fetch from 'node-fetch';
import baileys from '@whiskeysockets/baileys';

async function sendAlbumMessage(jid, medias, options = {}) {
    if (typeof jid !== "string") throw new TypeError(`jid must be string, received: ${jid}`);
    if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum");

    const caption = options.text || options.caption || "";
    const delay = !isNaN(options.delay) ? options.delay : 500;
    delete options.text;
    delete options.caption;
    delete options.delay;

    const album = baileys.generateWAMessageFromContent(
        jid,
        { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
        {}
    );

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const img = await baileys.generateWAMessage(
            album.key.remoteJid,
            { [type]: data, ...(i === 0 ? { caption } : {}) },
            { upload: conn.waUploadToServer }
        );
        img.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key },
        };
        await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
        await baileys.delay(delay);
    }
    return album;
}

const pinterest = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `❀ Por favor, ingresa lo que deseas buscar por Pinterest.`, m);

    await m.react('🕒');
    conn.reply(m.chat, '✧ *Descargando imágenes de Pinterest...*', m);

    try {
        const res = await fetch(`https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(text)}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length < 2) {
            return conn.reply(m.chat, '✧ No se encontraron suficientes imágenes para un álbum.', m);
        }

        const images = data.slice(0, 10).map(img => ({ type: "image", data: { url: img.image_large_url } }));

        const caption = `❀ *𝐑𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨𝐬 𝐝𝐞 𝐁𝐮́𝐬𝐪𝐮𝐞𝐝𝐚 𝐏𝐚𝐫𝐚:* ${text}
        ⌦ ⍴᥆ᥕᥱrᥱძ ᑲᥡ ᥕіrk 🌸`;
        await sendAlbumMessage(m.chat, images, { caption, quoted: m });

        await m.react('✅');
    } catch (error) {
        await m.react('❌');
        conn.reply(m.chat, '⚠︎ Hubo un error al obtener las imágenes de Pinterest.', m);
    }
};

pinterest.help = ['pinterest <query>'];
pinterest.tags = ['buscador', 'descargas'];
pinterest.command = ['pinterest', 'pin']
pinterest.register = true;
pinterest.group = true;

export default pinterest;