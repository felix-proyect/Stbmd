import yts from 'yt-search';
import { addToQueue, takeFromQueue, readQueue } from '../lib/queue.js';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';

let isWorkerRunning = false;
let sockInstance = null; // This will hold the bot's socket connection

// The main worker function that processes one request from the queue
async function processQueue() {
    if (isWorkerRunning || !sockInstance) {
        return; // Worker is already busy or not initialized
    }

    const request = takeFromQueue();
    if (!request) {
        console.log("[Artista Worker] Queue is empty. Worker is idle.");
        isWorkerRunning = false;
        return;
    }

    isWorkerRunning = true;
    const { chatId, artist, type, originalMessageKey } = request;

    try {
        await sockInstance.sendMessage(chatId, { text: `▶️ *Comenzando tu solicitud para "${artist}"!*\nBuscando las 50 canciones principales...` }, { quoted: { key: originalMessageKey } });

        const searchResults = await yts({ query: `${artist} top 50 songs`, pages: 3 });
        const videos = searchResults.videos.slice(0, 50);

        if (videos.length === 0) {
            throw new Error(`No se encontraron canciones para "${artist}".`);
        }

        await sockInstance.sendMessage(chatId, { text: `✅ *¡Se encontraron ${videos.length} canciones!*\nComenzando la descarga. Esto puede tardar varios minutos...` }, { quoted: { key: originalMessageKey } });

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            console.log(`[Artista Worker] Descargando [${i + 1}/${videos.length}]: ${video.title}`);

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
                    // This API failed, try the next one
                    continue;
                }
            }

            if (downloadResult && downloadResult.download) {
                try {
                    if (isAudio) {
                        await sockInstance.sendMessage(chatId, { audio: { url: downloadResult.download }, mimetype: 'audio/mpeg' });
                    } else {
                        await sockInstance.sendMessage(chatId, { video: { url: downloadResult.download }, caption: video.title });
                    }
                } catch (sendError) {
                    console.error(`[Artista Worker] Failed to send file for "${video.title}": ${sendError.message}`);
                }
            }
        }

        await sockInstance.sendMessage(chatId, { text: `✅ *¡Descarga completada!*\nSe enviaron ${videos.length} canciones de *${artist}*.` }, { quoted: { key: originalMessageKey } });

    } catch (error) {
        console.error("[Artista Worker] A critical error occurred:", error);
        await sockInstance.sendMessage(chatId, { text: `❌ *Ocurrió un error procesando tu solicitud para "${artist}"*.\nMotivo: ${error.message}` }, { quoted: { key: originalMessageKey } });
    } finally {
        isWorkerRunning = false;
        // Automatically check for the next item in the queue
        setTimeout(processQueue, 2000); // Small delay to prevent tight loops
    }
}

// This function will be imported and called from index.js after the bot connects
export function startArtistQueueWorker(sock) {
    if (!sockInstance) {
        sockInstance = sock;
    }
    const queue = readQueue();
    if (queue.length > 0) {
        console.log(`[Artista Worker] Found ${queue.length} items in queue on startup. Starting worker.`);
        processQueue();
    } else {
        console.log("[Artista Worker] Queue is empty on startup. Worker is ready.");
    }
}

// The user-facing command object
const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 50 canciones más populares de un artista. Usa artista2 para video.",
  aliases: ["artista2"],

  async execute({ sock, msg, args, commandName }) {
    const artist = args.join(' ');
    if (!artist) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Por favor, ingresa el nombre de un artista.\n\n*Ejemplo:*\n.artista Morat` }, { quoted: msg });
    }

    const type = commandName === 'artista' ? 'audio' : 'video';
    const queue = readQueue();

    const request = {
      chatId: msg.key.remoteJid,
      artist: artist,
      type: type,
      originalMessageKey: msg.key // Store key for quoting replies
    };

    addToQueue(request);

    const position = queue.length + 1;
    let replyText = `✅ *¡Tu solicitud para "${artist}" (${type}) ha sido agregada a la cola!*`;
    if (isWorkerRunning) {
        replyText += `\nHay ${position - 1} solicitud(es) antes que la tuya. Por favor, espera tu turno.`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });

    // Start the worker if it's not already running
    if (!isWorkerRunning) {
        startArtistQueueWorker(sock);
    }
  }
};

export default artistaCommand;