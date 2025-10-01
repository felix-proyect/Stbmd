import yts from 'yt-search';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';
import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { getCommandUsage, incrementCommandUsage } from '../lib/usage.js';

// Set to track active user requests, limited to 5 concurrent users
const activeUserRequests = new Set();
const MAX_CONCURRENT_REQUESTS = 5;
const STANDARD_COST = 1000;
const PREMIUM_COST = 10000;
const DAILY_LIMIT = 3;

// The main logic for fetching and sending songs for a single user, now with sequential processing
async function processArtistRequest(sock, msg, artist, type) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.sender;
    let successCount = 0;

    try {
        await sock.sendMessage(chatId, { text: `▶️ *Iniciando tu solicitud para "${artist}"!*\nBuscando las 15 canciones principales...` }, { quoted: msg });

        const searchResults = await yts({ query: `${artist} top songs`, pages: 1 });
        const videos = searchResults.videos.slice(0, 15);

        if (videos.length === 0) {
            throw new Error(`No se encontraron canciones para "${artist}".`);
        }

        await sock.sendMessage(chatId, { text: `✅ *¡Se encontraron ${videos.length} canciones!*\nComenzando la descarga secuencial para ahorrar recursos. Esto puede tardar...` }, { quoted: msg });

        for (const video of videos) {
            try {
                console.log(`[Artista] Procesando para ${senderId.split('@')[0]}: ${video.title}`);
                const isAudio = type === 'audio';
                const apis = isAudio
                    ? [() => savetube.download(video.url, 'mp3'), () => ogmp3.download(video.url, '320', 'audio')]
                    : [() => savetube.download(video.url, '720'), () => ogmp3.download(video.url, '720', 'video')];

                let downloadResult = null;
                for (const apiCall of apis) {
                    try {
                        const result = await apiCall();
                        if (result?.status && result.result?.download) {
                            downloadResult = result.result;
                            break;
                        }
                    } catch (e) {
                        console.error(`[Artista API Error] API falló para "${video.title}": ${e.message}`);
                        continue;
                    }
                }

                if (downloadResult?.download) {
                    if (isAudio) {
                        await sock.sendMessage(chatId, { audio: { url: downloadResult.download }, mimetype: 'audio/mpeg' });
                    } else {
                        await sock.sendMessage(chatId, { video: { url: downloadResult.download }, caption: video.title });
                    }
                    successCount++;
                } else {
                    await sock.sendMessage(chatId, { text: `⚠️ No se pudo descargar: "${video.title}". Saltando a la siguiente.`});
                    console.warn(`[Artista Download] Todas las APIs fallaron para "${video.title}".`);
                }
            } catch (songError) {
                console.error(`[Artista Song Error] No se pudo procesar "${video.title}": ${songError.message}`);
                await sock.sendMessage(chatId, { text: `❌ Error al procesar: "${video.title}". Saltando a la siguiente.`});
            }
        }

        await sock.sendMessage(chatId, { text: `✅ *¡Descarga completada!*\nSe enviaron ${successCount} de ${videos.length} canciones de *${artist}*.` }, { quoted: msg });

    } catch (error) {
        console.error("[Artista] A critical error occurred during the process:", error);
        await sock.sendMessage(chatId, { text: `❌ *Ocurrió un error procesando tu solicitud para "${artist}"*.\nMotivo: ${error.message}` }, { quoted: msg });
    }
}

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 15 canciones más populares de un artista (costo y límite diario).",
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

    const usage = getCommandUsage(senderId, 'artista');
    const currentCost = usage.count < DAILY_LIMIT ? STANDARD_COST : PREMIUM_COST;
    const isPremiumUse = usage.count >= DAILY_LIMIT;

    if (user.coins < currentCost) {
        let reply = `🪙 *Monedas insuficientes.*\nNecesitas ${currentCost} coins. Tu saldo es de ${user.coins} coins.`;
        if (isPremiumUse) {
            reply += `\n\n(Ya has superado tus ${DAILY_LIMIT} usos diarios, por eso el costo es más alto).`;
        }
        return sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
    }

    if (activeUserRequests.size >= MAX_CONCURRENT_REQUESTS) {
        return sock.sendMessage(msg.key.remoteJid, { text: `🛠️ *El servicio está actualmente a su máxima capacidad.*\nHay ${MAX_CONCURRENT_REQUESTS} descargas en proceso. Por favor, inténtalo de nuevo en unos minutos.` }, { quoted: msg });
    }

    user.coins -= currentCost;
    writeUsersDb(usersDb);
    incrementCommandUsage(senderId, 'artista');

    activeUserRequests.add(senderId);

    const updatedUsage = getCommandUsage(senderId, 'artista');
    let costMessage = `🪙 Se han deducido ${currentCost} coins. Tu solicitud ha comenzado.`;
    costMessage += isPremiumUse
        ? `\n(Este es tu uso número ${updatedUsage.count} de hoy).`
        : `\n(Uso ${updatedUsage.count} de ${DAILY_LIMIT} hoy).`;

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