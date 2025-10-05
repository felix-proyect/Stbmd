import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const chopCommand = {
  name: "chop",
  category: "rpg",
  description: "Tala árboles para conseguir madera.",
  aliases: ["talar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
    const lastChop = user.lastChop || 0;
    const now = Date.now();

    if (now - lastChop < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastChop);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Los árboles necesitan tiempo para crecer. Vuelve a talar en ${minutesLeft} minutos.` }, { quoted: msg });
    }

    const woodGained = Math.floor(Math.random() * 8) + 3; // 3-10 de madera
    user.inventory.wood = (user.inventory.wood || 0) + woodGained;
    user.lastChop = now;

    writeUsersDb(usersDb);

    const successMessage = `*🪓 Tala de Árboles 🪓*\n\n¡Has trabajado duro y conseguiste *${woodGained}* de madera! 🪵`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default chopCommand;