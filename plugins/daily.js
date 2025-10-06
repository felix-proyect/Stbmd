import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const dailyCommand = {
  name: "daily",
  category: "rpg",
  description: "Reclama tu recompensa diaria de monedas.",
  aliases: ["diario"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const COOLDOWN_MS = 22 * 60 * 60 * 1000; // 22 horas para dar un margen
    const lastDaily = user.lastDaily || 0;
    const now = Date.now();

    if (now - lastDaily < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastDaily);
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Ya reclamaste tu recompensa diaria. Vuelve en ${hoursLeft}h y ${minutesLeft}m.` }, { quoted: msg });
    }

    const reward = 500 + Math.floor(user.level * 10); // Recompensa base + bonus por nivel
    user.coins = (user.coins || 0) + reward;
    user.lastDaily = now;

    writeUsersDb(usersDb);

    const successMessage = `*🎁 Recompensa Diaria 🎁*\n\n¡Has reclamado tu recompensa de *${reward}* monedas! Vuelve mañana para obtener más.`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default dailyCommand;