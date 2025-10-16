import axios from 'axios';
const { proto, generateWAMessageFromContent, getDevice } = (await import("@whiskeysockets/baileys")).default;

async function createVideoMessage(url, conn) {
    const { videoMessage } = await generateWAMessageContent({ video: { url } }, { upload: conn.waUploadToServer });
    return videoMessage;
}

async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const tiktoksearchCommand = {
    name: 'tiktoksearch',
    category: 'buscador',
    description: 'Busca videos en TikTok y los muestra en un carrusel.',
    aliases: ['tiktoks'],

    async execute({ sock, msg, args }) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(msg.key.remoteJid, { text: '☁️ *¿Que quieres buscar en TikTok?*' }, { quoted: msg });

        try {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

            const { data: response } = await axios.get(`https://delirius-apiofc.vercel.app/search/tiktoksearch?query=${text}`);
            let searchResults = response.meta;

            shuffleArray(searchResults);
            let selectedResults = searchResults.slice(0, 7);

            let results = [];
            for (let result of selectedResults) {
                results.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: null }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: 'Resultados de TikTok' }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: result.title,
                        hasMediaAttachment: true,
                        videoMessage: await createVideoMessage(result.hd, sock)
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: [] })
                });
            }

            const responseMessage = generateWAMessageFromContent(msg.key.remoteJid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: '☁️ Resultado de: ' + text }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: '🔎 TikTok - Busquedas' }),
                            header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: [...results] })
                        })
                    }
                }
            }, { quoted: msg });

            await sock.relayMessage(msg.key.remoteJid, responseMessage.message, { messageId: responseMessage.key.id });
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error: ${error.toString()}` }, { quoted: msg });
        }
    }
};

export default tiktoksearchCommand;