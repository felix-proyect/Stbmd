import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const fishCommand = {
  name: "fish",
  category: "rpg",
  description: "Ve de pesca para conseguir peces y otros objetos.",
  aliases: ["pescar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const COOLDOWN_MS = 7 * 60 * 1000; // 7 minutos
    const lastFish = user.lastFish || 0;
    const now = Date.now();

    if (now - lastFish < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastFish);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Los peces no pican todavía. Vuelve a intentarlo en ${minutesLeft} minutos.` }, { quoted: msg });
    }

    const fishCaught = Math.floor(Math.random() * 5) + 1; // 1-5 peces
    const coinsGained = Math.floor(Math.random() * 20) + 5; // 5-24 monedas

    user.inventory.fish = (user.inventory.fish || 0) + fishCaught;
    user.coins = (user.coins || 0) + coinsGained;
    user.lastFish = now;

    writeUsersDb(usersDb);

    const successMessage = `*🎣 Día de Pesca 🎣*\n\nLanzaste tu caña y conseguiste:\n\n` +
                           `> 🐟 *${fishCaught}* Pescado(s)\n` +
                           `> 💰 *${coinsGained}* Monedas`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default fishCommand;