import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const forageCommand = {
  name: "forage",
  category: "rpg",
  description: "Recolecta recursos del bosque.",
  aliases: ["recolectar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const COOLDOWN_MS = 6 * 60 * 1000; // 6 minutos
    const lastForage = user.lastForage || 0;
    const now = Date.now();

    if (now - lastForage < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastForage);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Ya has recolectado todo lo que había por la zona. Vuelve en ${minutesLeft} minutos.` }, { quoted: msg });
    }

    const berriesGained = Math.floor(Math.random() * 6) + 2; // 2-7 bayas
    const herbsGained = Math.floor(Math.random() * 4) + 1; // 1-4 hierbas

    user.inventory.berries = (user.inventory.berries || 0) + berriesGained;
    user.inventory.herbs = (user.inventory.herbs || 0) + herbsGained;
    user.lastForage = now;

    writeUsersDb(usersDb);

    const successMessage = `*🌿 Recolección 🌿*\n\nTe adentraste en el bosque y encontraste:\n\n` +
                           `> 🍓 *${berriesGained}* Baya(s)\n` +
                           `> 🌱 *${herbsGained}* Hierba(s)`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default forageCommand;