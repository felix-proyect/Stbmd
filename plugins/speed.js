import { totalmem, freemem } from 'os';
import osu from 'node-os-utils';
import { sizeFormatter } from 'human-readable';
import { performance } from 'perf_hooks';
import config from '../config.js';

const cpu = osu.cpu;
const format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
});

// Helper function to format uptime
function clockString(ms) {
  if (isNaN(ms)) return '--d --h --m --s';
  let d = Math.floor(ms / 86400000);
  let h = Math.floor((ms % 86400000) / 3600000);
  let m = Math.floor((ms % 3600000) / 60000);
  let s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

const speedCommand = {
  name: "speed",
  category: "herramientas",
  description: "Muestra el estado y la velocidad del bot.",
  aliases: ["sped", "estado"],

  async execute({ sock, msg }) {
    if (sock.sendPresenceUpdate) await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
    const start = performance.now();

    // Uptime
    const muptime = clockString(process.uptime() * 1000);

    // Chats
    const chats = Object.values(sock.chats).filter(chat => chat.id.endsWith('@s.whatsapp.net'));
    const groups = Object.values(sock.chats).filter(chat => chat.id.endsWith('@g.us'));

    // CPU Usage
    const cpuUsage = await cpu.usage();

    // Date and Time (using server's local time as a fallback)
    let fecha, hora;
    try {
        const now = new Date();
        fecha = now.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' });
        hora = now.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: true, hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        console.warn("Could not get Peru time, using server default.", e);
        const now = new Date();
        fecha = now.toLocaleDateString();
        hora = now.toLocaleTimeString();
    }

    const latency = (performance.now() - start).toFixed(4);

    const meta = {
      key: {
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "Halo"
      },
      message: {
        contactMessage: {
          displayName: config.botName, // Use bot name from config
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${config.botName},;;;\nFN:${config.botName}\nitem1.TEL;waid=${msg.sender.split('@')[0]}:${msg.sender.split('@')[0]}\nitem1.X-ABLabel:Usuario\nEND:VCARD`,
          sendEphemeral: true
        }
      }
    };

    const texto = `
⚡ *Estado del Bot*

📡 *Velocidad de Respuesta:*
→ _${latency} ms_

⏱️ *Tiempo Activo:*
→ _${muptime}_

💬 *Chats Activos:*
→ 👤 _${chats.length}_ chats privados
→ 👥 _${groups.length}_ grupos

🖥️ *Uso de RAM:*
→ 💾 _${format(totalmem() - freemem())}_ / _${format(totalmem())}_

⚙️ *Uso de CPU:*
→ _${cpuUsage.toFixed(2)} %_

📊 *Fecha y Hora:*
→ ${fecha}
→ ${hora}
`.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: texto }, { quoted: meta });
    if (msg.react) await msg.react('✈️');
  }
};

export default speedCommand;