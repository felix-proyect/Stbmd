import fetch from 'node-fetch';
import yts from 'yt-search';
import axios from 'axios';
import { savetube } from '../lib/yt-savetube.js';
import { ogmp3 } from '../lib/youtubedl.js';
import config from '../config.js';

const LimitAud = 725 * 1024 * 1024; // 725MB
const LimitVid = 425 * 1024 * 1024; // 425MB
const userRequests = new Set();

// Helper function to get the size of a remote file
async function getFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return parseInt(response.headers.get('content-length') || 0);
  } catch {
    return 0; // If HEAD request fails, assume 0
  }
}

// Helper function to format duration in seconds to a readable string
function secondString(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(d + (d === 1 ? ' día' : ' días'));
    if (h > 0) parts.push(h + (h === 1 ? ' hora' : ' horas'));
    if (m > 0) parts.push(m + (m === 1 ? ' minuto' : ' minutos'));
    if (s > 0) parts.push(s + (s === 1 ? ' segundo' : ' segundos'));
    return parts.join(', ');
}

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga audio o video de YouTube con múltiples opciones y APIs.",
  aliases: ['musica', 'play2', 'video', 'play3', 'playdoc', 'play4', 'playdoc2'],

  async execute({ sock, msg, args, commandName }) {
    const text = args.join(' ');
    if (!text.trim()) {
      return sock.sendMessage(msg.key.remoteJid, { text: `*🤔 ¿Qué estás buscando?*\nIngresa el nombre o enlace de la canción.\n\n*Ejemplo:*\n.play Morat` }, { quoted: msg });
    }

    if (userRequests.has(msg.sender)) {
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Oye, calma. Ya tienes una descarga en proceso. Espera a que termine.` }, { quoted: msg });
    }

    userRequests.add(msg.sender);

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } });

      const searchResults = await yts(text);
      const video = searchResults.videos[0];

      if (!video) {
        throw new Error('No se encontraron resultados para tu búsqueda.');
      }

      const tipoDescarga = ['play', 'musica', 'play3', 'playdoc'].includes(commandName) ? 'audio' : 'video';

      await sock.sendMessage(msg.key.remoteJid, { text: `*${video.title}*\n\n*⇄ㅤ     ◁   ㅤ  ❚❚ㅤ     ▷ㅤ     ↻*\n\n*⏰ Duración:* ${secondString(video.duration.seconds)}\n*👉🏻 Aguarde un momento en lo que envío su ${tipoDescarga}*`}, { quoted: msg });

      // --- Lógica de descarga ---
      const isAudio = ['play', 'musica', 'play3', 'playdoc'].includes(commandName);
      const isDocument = ['play3', 'playdoc', 'play4', 'playdoc2'].includes(commandName);

      const audioApis = [
        () => savetube.download(video.url, 'mp3'),
        () => ogmp3.download(video.url, '320', 'audio')
      ];
      const videoApis = [
        () => savetube.download(video.url, '720'),
        () => ogmp3.download(video.url, '720', 'video')
      ];

      let downloadResult = null;
      for (const apiCall of (isAudio ? audioApis : videoApis)) {
        try {
          const result = await apiCall();
          if (result && result.status && result.result.download) {
            downloadResult = result.result;
            break;
          }
        } catch (e) {
          console.error(`Fallo de API en Play: ${e.message}`);
          continue;
        }
      }

      if (!downloadResult) {
        throw new Error('Todas las APIs de descarga fallaron.');
      }

      const fileSize = await getFileSize(downloadResult.download);
      const sizeLimit = isAudio ? LimitAud : LimitVid;

      if (fileSize > sizeLimit || isDocument) {
        await sock.sendMessage(msg.key.remoteJid, {
          document: { url: downloadResult.download },
          mimetype: isAudio ? 'audio/mpeg' : 'video/mp4',
          fileName: `${downloadResult.title}.${isAudio ? 'mp3' : 'mp4'}`,
          caption: `✅ *Descarga como documento*\n*Título:* ${downloadResult.title}`
        }, { quoted: msg });
      } else {
        if (isAudio) {
          await sock.sendMessage(msg.key.remoteJid, { audio: { url: downloadResult.download }, mimetype: 'audio/mpeg' }, { quoted: msg });
        } else {
          await sock.sendMessage(msg.key.remoteJid, { video: { url: downloadResult.download }, caption: `✅ *${downloadResult.title}*` }, { quoted: msg });
        }
      }
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error("Error en el comando play:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error: ${error.message}` }, { quoted: msg });
    } finally {
      userRequests.delete(msg.sender);
    }
  }
};

export default playCommand;