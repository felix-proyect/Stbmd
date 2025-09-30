import fetch from 'node-fetch';

// Helper function to fetch TikTok data from an external API
async function tiktokdl(url) {
    // The API endpoint seems to require hd=1, keeping it as per the provided code.
    const tikwm = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}?hd=1`;
    try {
        const response = await fetch(tikwm);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("tiktokdl error:", error);
        return null; // Return null to indicate failure
    }
}

// The main handler for automatic TikTok downloads
const tiktokAutoDownloader = {
    // This isn't a command to be called, but a handler.
    // We'll give it a name for identification.
    name: 'tiktok-auto-downloader',

    // We'll add a custom property to identify it as an automatic handler
    isAutoHandler: true,

    // The execute function will be called by the main handler for every message
    async execute({ sock, msg }) {
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (!body) return;

        const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+)/i;
        const match = body.match(tiktokRegex);

        // If no TikTok link is found, do nothing
        if (!match) return;

        const url = match[0];
        const emoji = '🌸';

        try {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '🕒', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: `${emoji} Vi un link de TikTok! Espere un momento, estoy descargando el video...` }, { quoted: msg });

            const tiktokData = await tiktokdl(url);

            if (!tiktokData || tiktokData.code !== 0 || !tiktokData.data?.play) {
                 await sock.sendMessage(msg.key.remoteJid, { text: "Error: No se pudo obtener el video de TikTok. La API puede haber fallado." }, { quoted: msg });
                 return;
            }

            const videoURL = tiktokData.data.play;
            const caption = tiktokData.data.title ? `${emoji} *${tiktokData.data.title}*` : `${emoji} Aquí tienes ฅ^•ﻌ•^ฅ`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    video: { url: videoURL },
                    caption: caption,
                    mimetype: 'video/mp4'
                },
                { quoted: msg }
            );

            // Send success reaction in its own try-catch to prevent it from triggering the main error block.
            try {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
            } catch (reactError) {
                console.error("Error sending success reaction:", reactError);
            }

        } catch (error) {
            console.error("Error in TikTok auto-downloader:", error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: `Error al descargar el video: ${error.message}` }, { quoted: msg });
        }
    }
};

export default tiktokAutoDownloader;