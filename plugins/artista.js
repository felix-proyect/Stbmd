import yts from 'yt-search';
import axios from 'axios';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';
import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { getCommandUsage, incrementCommandUsage } from '../lib/usage.js';

const activeUserRequests = new Set();
const MAX_CONCURRENT_REQUESTS = 5;
const STANDARD_COST = 1000;
const PREMIUM_COST = 10000;
const DAILY_LIMIT = 3;

// --- Función para descargar usando las APIs de Adonix ---
async function downloadFromAdonix(url, type) {
  try {
    const apiUrl =
      type === 'audio'
        ? `https://api-adonix.ultraplus.click/download/ytmp3?apikey=gawrgurabot&url=${encodeURIComponent(url)}`
        : `https://api-adonix.ultraplus.click/download/ytmp4?apikey=gawrgurabot&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { timeout: 25000 });

    if (data?.status && data.data?.url) {
      return {
        status: true,
        result: {
          title: data.data.title || 'Sin título',
          download: data.data.url
        }
      };
    }
    return { status: false };
  } catch (err) {
    console.error(`[Adonix API Error] ${type} -> ${err.message}`);
    return { status: false };
  }
}

// --- Lógica principal de descarga secuencial ---
async function processArtistRequest(sock, msg, artist, type) {
  const chatId = msg.key.remoteJid;
  const senderId = msg.sender;
  let successCount = 0;

  try {
    await sock.sendMessage(chatId, { text: `▶️ *Iniciando tu solicitud para "${artist}"!*\nBuscando las 15 canciones principales...` }, { quoted: msg });

    const searchResults = await yts({ query: `${artist} top songs`, pages: 1 });
    const videos = searchResults.videos.slice(0, 15);

    if (videos.length === 0) throw new Error(`No se encontraron canciones para "${artist}".`);

    await sock.sendMessage(chatId, { text: `✅ *¡Se encontraron ${videos.length} canciones!*\nComenzando la descarga secuencial...` }, { quoted: msg });

    for (const video of videos) {
      try {
        console.log(`[Artista] Procesando: ${video.title}`);
        const isAudio = type === 'audio';

        const apis = [
          () => downloadFromAdonix(video.url, isAudio ? 'audio' : 'video'),
          () => savetube.download(video.url, isAudio ? 'mp3' : '720'),
          () => ogmp3.download(video.url, isAudio ? '320' : '720', isAudio ? 'audio' : 'video'),
        ];

        let downloadResult = null;
        for (const apiCall of apis) {
          try {
            const result = await apiCall();
            if (result?.status && result.result?.download) {
              downloadResult = result.result;
              break;
            }
          } catch (e) {
            console.error(`[Artista API Error] Falló para "${video.title}": ${e.message}`);
          }
        }

        if (downloadResult?.download) {
          if (isAudio) {
            await sock.sendMessage(chatId, {
              audio: { url: downloadResult.download },
              mimetype: 'audio/mpeg',
              ptt: false,
              fileName: `${downloadResult.title}.mp3`
            });
          } else {
            await sock.sendMessage(chatId, {
              video: { url: downloadResult.download },
              caption: downloadResult.title
            });
          }
          successCount++;
        } else {
          await sock.sendMessage(chatId, { text: `⚠️ No se pudo descargar: "${video.title}".` });
        }
      } catch (err) {
        console.error(`[Artista Song Error] "${video.title}": ${err.message}`);
        await sock.sendMessage(chatId, { text: `❌ Error al procesar: "${video.title}".` });
      }
    }

    await sock.sendMessage(chatId, {
      text: `✅ *Descarga completada.*\nSe enviaron ${successCount} de ${videos.length} canciones de *${artist}*.`
    }, { quoted: msg });

  } catch (error) {
    console.error("[Artista Error]", error);
    await sock.sendMessage(chatId, {
      text: `❌ Ocurrió un error con "${artist}".\nMotivo: ${error.message}`
    }, { quoted: msg });
  }
}

// --- Comando principal ---
const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 15 canciones más populares de un artista.",
  aliases: ["artista2"],

  async execute({ sock, msg, args, commandName }) {
    const artist = args.join(' ');
    if (!artist)
      return sock.sendMessage(msg.key.remoteJid, {
        text: `Por favor, ingresa el nombre de un artista.\n\n*Ejemplo:*\n.artista Morat`
      }, { quoted: msg });

    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user)
      return sock.sendMessage(msg.key.remoteJid, {
        text: "No estás registrado. Usa el comando `reg` para registrarte."
      }, { quoted: msg });

    const usage = getCommandUsage(senderId, 'artista');
    const currentCost = usage.count < DAILY_LIMIT ? STANDARD_COST : PREMIUM_COST;
    const isPremiumUse = usage.count >= DAILY_LIMIT;

    if (user.coins < currentCost)
      return sock.sendMessage(msg.key.remoteJid, {
        text: `🪙 *Monedas insuficientes.*\nNecesitas ${currentCost} coins. Tienes ${user.coins}.`
      }, { quoted: msg });

    if (activeUserRequests.size >= MAX_CONCURRENT_REQUESTS)
      return sock.sendMessage(msg.key.remoteJid, {
        text: `🛠️ *Máxima capacidad alcanzada.*\nPor favor, inténtalo de nuevo en unos minutos.`
      }, { quoted: msg });

    user.coins -= currentCost;
    writeUsersDb(usersDb);
    incrementCommandUsage(senderId, 'artista');

    activeUserRequests.add(senderId);

    const updatedUsage = getCommandUsage(senderId, 'artista');
    const type = commandName === 'artista' ? 'audio' : 'video';

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🪙 Se dedujeron ${currentCost} coins.\n(Uso ${updatedUsage.count}${isPremiumUse ? ' premium' : ''}).`
    }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: '🎵', key: msg.key } });

    processArtistRequest(sock, msg, artist, type)
      .finally(() => {
        activeUserRequests.delete(senderId);
        console.log(`[Artista] ${senderId.split('@')[0]} finalizó.`);
      });
  }
};

export default artistaCommand;
