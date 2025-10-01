import yts from 'yt-search';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';
import { readUsersDb, writeUsersDb } from '../lib/database.js';

// Set to track active user requests, limited to 3 concurrent users
const activeUserRequests = new Set();
const MAX_CONCURRENT_REQUESTS = 3;
const ARTISTA_COMMAND_COST = 1000;

// Helper function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The main logic for fetching and sending songs for a single user
async function processArtistRequest(sock, msg, artist, type) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.sender;

    try {
        await sock.sendMessage(chatId, { text: `▶️ *Iniciando tu solicitud para "${artist}"!*\nBuscando las 50 canciones principales...` }, { quoted: msg });

        const searchResults = await yts({ query: `${artist} top 50 songs`, pages: 3 });
        const videos = searchResults.videos.slice(0, 50);

        if (videos.length === 0) {
            throw new Error(`No se encontraron canciones para "${artist}".`);
        }

        await sock.sendMessage(chatId, { text: `✅ *¡Se encontraron ${videos.length} canciones!*\nComenzando la descarga. Se enviará una cada 10 segundos.` }, { quoted: msg });

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            console.log(`[Artista] Descargando para ${senderId.split('@')[0]} [${i + 1}/${videos.length}]: ${video.title}`);

            const isAudio = type === 'audio';
            const apis = isAudio
                ? [() => savetube.download(video.url, 'mp3'), () => ogmp3.download(video.url, '320', 'audio')]
                : [() => savetube.download(video.url, '720'), () => ogmp3.download(video.url, '720', 'video')];

            let downloadResult = null;
            for (const apiCall of apis) {
                try {
                    const result = await apiCall();
                    if (result && result.status && result.result.download) {
                        downloadResult = result.result;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (downloadResult && downloadResult.download) {
                try {
                    if (isAudio) {
                        await sock.sendMessage(chatId, { audio: { url: downloadResult.download }, mimetype: 'audio/mpeg' });
                    } else {
                        await sock.sendMessage(chatId, { video: { url: downloadResult.download }, caption: video.title });
                    }
                } catch (sendError) {
                    console.error(`[Artista] Failed to send file for "${video.title}": ${sendError.message}`);
                }
            }
            await delay(10000);
        }

        await sock.sendMessage(chatId, { text: `✅ *¡Descarga completada!*\nSe enviaron ${videos.length} canciones de *${artist}*.` }, { quoted: msg });

    } catch (error) {
        console.error("[Artista] A critical error occurred:", error);
        await sock.sendMessage(chatId, { text: `❌ *Ocurrió un error procesando tu solicitud para "${artist}"*.\nMotivo: ${error.message}` }, { quoted: msg });
    }
}

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 50 canciones más populares de un artista (costo: 1000 coins).",
  aliases: ["artista2"],

  async execute({ sock, msg, args, commandName }) {
    const artist = args.join(' ');
    if (!artist) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Por favor, ingresa el nombre de un artista.\n\n*Ejemplo:*\n.artista Morat` }, { quoted: msg });
    }

    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    // 1. Check user registration and balance
    if (!user) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }
    if (user.coins < ARTISTA_COMMAND_COST) {
        return sock.sendMessage(msg.key.remoteJid, { text: `🪙 *Monedas insuficientes.*\nNecesitas ${ARTISTA_COMMAND_COST} coins para usar este comando. Tu saldo es de ${user.coins} coins.` }, { quoted: msg });
    }

    // 2. Check concurrent request limit
    if (activeUserRequests.size >= MAX_CONCURRENT_REQUESTS) {
        return sock.sendMessage(msg.key.remoteJid, { text: `🛠️ *El servicio está actualmente a su máxima capacidad.*\nHay ${MAX_CONCURRENT_REQUESTS} descargas en proceso. Por favor, inténtalo de nuevo en unos minutos.` }, { quoted: msg });
    }

    // 3. Deduct coins and add user to active requests
    user.coins -= ARTISTA_COMMAND_COST;
    writeUsersDb(usersDb);
    activeUserRequests.add(senderId);

    await sock.sendMessage(msg.key.remoteJid, { text: `🪙 Se han deducido ${ARTISTA_COMMAND_COST} coins. Tu solicitud ha comenzado.` }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '👍', key: msg.key } });

    const type = commandName === 'artista' ? 'audio' : 'video';

    // Process the request immediately and release the slot when done
    processArtistRequest(sock, msg, artist, type)
        .finally(() => {
            activeUserRequests.delete(senderId);
            console.log(`[Artista] Request for ${senderId.split('@')[0]} has finished. Slot freed.`);
        });
  }
};

export default artistaCommand;