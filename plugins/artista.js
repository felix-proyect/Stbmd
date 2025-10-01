import yts from 'yt-search';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';
import { readUsersDb, writeUsersDb } from '../lib/database.js';

// Set to track active user requests, limited to 5 concurrent users
const activeUserRequests = new Set();
const MAX_CONCURRENT_REQUESTS = 5;
const STANDARD_COST = 1000;
const PREMIUM_COST = 10000;
const DAILY_LIMIT = 3;

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// The main logic for fetching and sending songs for a single user
async function processArtistRequest(sock, msg, artist, type) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.sender;

    try {
        await sock.sendMessage(chatId, { text: `▶️ *Iniciando tu solicitud para "${artist}"!*\nBuscando las 15 canciones principales...` }, { quoted: msg });

        const searchResults = await yts({ query: `${artist} top songs`, pages: 1 });
        const videos = searchResults.videos.slice(0, 15);

        if (videos.length === 0) {
            throw new Error(`No se encontraron canciones para "${artist}".`);
        }

        await sock.sendMessage(chatId, { text: `✅ *¡Se encontraron ${videos.length} canciones!*\nComenzando la descarga...` }, { quoted: msg });

        for (const video of videos) {
            console.log(`[Artista] Descargando para ${senderId.split('@')[0]}: ${video.title}`);
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
                } catch (e) { continue; }
            }

            if (downloadResult?.download) {
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
  description: "Descarga las 15 canciones más populares de un artista. Tiene un costo y límite diario.",
  aliases: ["artista2"],

  async execute({ sock, msg, args, commandName }) {
    const artist = args.join(' ');
    if (!artist) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Por favor, ingresa el nombre de un artista.\n\n*Ejemplo:*\n.artista Morat` }, { quoted: msg });
    }

    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Initialize usage data if it doesn't exist
    if (!user.artista_uses) {
        user.artista_uses = { count: 0, last_used: '' };
    }

    const today = getTodayDate();
    // Reset count if it's a new day
    if (user.artista_uses.last_used !== today) {
        user.artista_uses.count = 0;
        user.artista_uses.last_used = today;
    }

    const currentCost = user.artista_uses.count < DAILY_LIMIT ? STANDARD_COST : PREMIUM_COST;
    const isPremiumUse = user.artista_uses.count >= DAILY_LIMIT;

    if (user.coins < currentCost) {
        let reply = `🪙 *Monedas insuficientes.*\nNecesitas ${currentCost} coins para usar este comando. Tu saldo es de ${user.coins} coins.`;
        if (isPremiumUse) {
            reply += `\n\n(Ya has superado tus ${DAILY_LIMIT} usos diarios, por eso el costo es más alto).`;
        }
        return sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
    }

    if (activeUserRequests.size >= MAX_CONCURRENT_REQUESTS) {
        return sock.sendMessage(msg.key.remoteJid, { text: `🛠️ *El servicio está actualmente a su máxima capacidad.*\nHay ${MAX_CONCURRENT_REQUESTS} descargas en proceso. Por favor, inténtalo de nuevo en unos minutos.` }, { quoted: msg });
    }

    // Deduct coins, increment usage, and save
    user.coins -= currentCost;
    user.artista_uses.count++;
    writeUsersDb(usersDb);

    activeUserRequests.add(senderId);

    let costMessage = `🪙 Se han deducido ${currentCost} coins. Tu solicitud ha comenzado.`;
    if (isPremiumUse) {
        costMessage += `\n(Este es tu uso número ${user.artista_uses.count} de hoy).`;
    } else {
        costMessage += `\n(Uso ${user.artista_uses.count} de ${DAILY_LIMIT} hoy).`;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: costMessage }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '👍', key: msg.key } });

    const type = commandName === 'artista' ? 'audio' : 'video';

    processArtistRequest(sock, msg, artist, type)
        .finally(() => {
            activeUserRequests.delete(senderId);
            console.log(`[Artista] Request for ${senderId.split('@')[0]} has finished. Slot freed.`);
        });
  }
};

export default artistaCommand;