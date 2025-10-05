import { readUsersDb } from '../lib/database.js';

const waifuTopCommand = {
  name: "waifutop",
  category: "gacha",
  description: "Muestra el top 10 de los coleccionistas de waifus con más valor.",
  aliases: ["topwaifus", "haremtop"],

  async execute({ sock, msg }) {
    const usersDb = readUsersDb();
    const leaderboard = [];

    for (const userId in usersDb) {
      const user = usersDb[userId];
      if (user.harem && user.harem.length > 0) {
        const totalValue = user.harem.reduce((sum, waifu) => sum + (waifu.value || 0), 0);
        if (totalValue > 0) {
          leaderboard.push({
            name: user.name || userId.split('@')[0],
            totalValue: totalValue,
            count: user.harem.length
          });
        }
      }
    }

    if (leaderboard.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Nadie tiene waifus todavía. ¡Sé el primero en el ranking!" }, { quoted: msg });
    }

    // Ordenar por valor total descendente
    leaderboard.sort((a, b) => b.totalValue - a.totalValue);

    const top10 = leaderboard.slice(0, 10);

    let topMessage = `*🏆 Top 10 Coleccionistas de Waifus 🏆*\n\n_(Clasificación por valor total del harén)_\n\n`;
    top10.forEach((entry, index) => {
      topMessage += `${index + 1}. *${entry.name}*\n` +
                    `   - Valor Total: ${entry.totalValue} WFCoins\n` +
                    `   - Waifus: ${entry.count}\n\n`;
    });

    await sock.sendMessage(msg.key.remoteJid, { text: topMessage.trim() }, { quoted: msg });
  }
};

export default waifuTopCommand;