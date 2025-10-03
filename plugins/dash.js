import { commandUsage } from '../index.js';
import os from 'os';
import osu from 'node-os-utils';
import human from 'human-readable';

const dashCommand = {
  name: "dash",
  category: "propietario",
  description: "Muestra un dashboard con estadísticas del bot.",
  aliases: ["dashboard"],

  async execute({ sock, msg }) {
    try {
      // 1. Command Usage Stats
      const totalCommands = Array.from(commandUsage.values()).reduce((a, b) => a + b, 0);
      const sortedCommands = [...commandUsage.entries()].sort((a, b) => b[1] - a[1]);
      const topCommands = sortedCommands.slice(0, 5);

      let topCommandsStr = topCommands
        .map(([name, count], index) => `  ${index + 1}. ${name}: ${count}`)
        .join('\n');

      if (sortedCommands.length === 0) {
          topCommandsStr = "  No commands have been used yet.";
      }

      // 2. Uptime
      const uptimeSeconds = process.uptime();
      const d = Math.floor(uptimeSeconds / (3600 * 24));
      const h = Math.floor(uptimeSeconds % (3600 * 24) / 3600);
      const m = Math.floor(uptimeSeconds % 3600 / 60);
      const s = Math.floor(uptimeSeconds % 60);
      const uptimeStr = `${d}d ${h}h ${m}m ${s}s`;

      // 3. Memory and System Info
      const memInfo = await osu.mem.info();
      const usedMemory = human.format.bytes(process.memoryUsage().rss);
      const totalMemory = `${memInfo.totalMemMb} MB`;
      const freeMemory = `${memInfo.freeMemMb} MB`;

      const cpuUsage = await osu.cpu.usage();
      const osInfo = `${os.type()} ${os.release()} (${os.arch()})`;
      const nodeVersion = process.version;

      // 4. Construct the message
      const dashText = `*🤖 Bot Dashboard 🤖*

*📊 Command Stats*
- Total Executed: *${totalCommands}*
- Top 5 Commands:
${topCommandsStr}

*⏱️ System Status*
- Uptime: *${uptimeStr}*
- OS: *${osInfo}*
- Node.js: *${nodeVersion}*
- CPU Usage: *${cpuUsage.toFixed(2)}%*
- Memory (RSS): *${usedMemory}*
- Memory (Free/Total): *${freeMemory} / ${totalMemory}*`;

      await sock.sendMessage(msg.key.remoteJid, { text: dashText.trim() }, { quoted: msg });
    } catch (e) {
      console.error("Error in dash command:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error generating dashboard." }, { quoted: msg });
    }
  }
};

export default dashCommand;