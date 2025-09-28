import fetch from 'node-fetch';

// Helper function to convert a readable stream into a Buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const iavozCommand = {
    name: 'iavoz',
    category: 'ia',
    description: 'Genera una nota de voz a partir de un texto usando una IA.',
    aliases: ['tts-ia'],

    async execute({ sock, msg, args }) {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(msg.key.remoteJid, { text: '🗣️ Por favor, proporciona un texto para que la IA lo convierta en voz.' }, { quoted: msg });
        }

        try {
            // Inform the user that the process is starting
            await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '🤖', key: msg.key } });

            // Fetch the audio from the API
            const res = await fetch(`https://myapiadonix.vercel.app/api/adonixvoz?q=${encodeURIComponent(text)}`);

            if (!res.ok) {
                throw new Error(`La API no pudo generar el audio (status: ${res.status}).`);
            }

            const bufferAudio = await streamToBuffer(res.body);

            // Send the audio as a voice note (ptt: true)
            await sock.sendMessage(msg.key.remoteJid, {
                audio: bufferAudio,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: msg });

            // Clear the reaction as a sign of completion
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

        } catch (e) {
            console.error("Error in iavoz command:", e);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Ocurrió un error al generar la nota de voz. Por favor, inténtalo de nuevo.' }, { quoted: msg });
        }
    }
};

export default iavozCommand;