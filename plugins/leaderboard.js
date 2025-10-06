import { readUsersDb } from '../lib/database.js';

const leaderboardCommand = {
  name: "leaderboard",
  category: "rpg",
  description: "Muestra la clasificación de los mejores jugadores.",
  aliases: ["top", "ranking"],

  async execute({ sock, msg }) {
    const usersDb = readUsersDb();
    const players = Object.values(usersDb).filter(u => u.level && u.xp !== undefined);

    if (players.length < 1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No hay suficientes jugadores en el ranking todavía." }, { quoted: msg });
    }

    // --- Top por Nivel ---
    const topByLevel = [...players].sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, 10);
    let levelMessage = `*🏆 Top 10 - Nivel 🏆*\n\n`;
    topByLevel.forEach((player, index) => {
        levelMessage += `${index + 1}. *${player.name || 'Usuario sin nombre'}* - Nivel ${player.level} (${player.xp} XP)\n`;
    });

    // --- Top por Riqueza ---
    const topByCoins = [...players].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 10);
    let coinsMessage = `\n*💰 Top 10 - Riqueza 💰*\n\n`;
    topByCoins.forEach((player, index) => {
        coinsMessage += `${index + 1}. *${player.name || 'Usuario sin nombre'}* - ${player.coins || 0} WFCoins\n`;
    });

    const finalMessage = levelMessage + coinsMessage;

    await sock.sendMessage(msg.key.remoteJid, { text: finalMessage.trim() }, { quoted: msg });
  }
};

export default leaderboardCommand;