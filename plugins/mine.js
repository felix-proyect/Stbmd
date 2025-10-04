import { readUsersDb, writeUsersDb } from '../lib/database.js';

const mineCommand = {
  name: "mine",
  category: "economia",
  description: "Usa tu pico para minar gemas y conseguir monedas. Requiere un 'Pico de Hierro'.",
  aliases: ["minar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 7 * 60 * 1000; // 7 minutos

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Verificar si el usuario tiene un pico
    if (!user.inventory || !user.inventory.pico || user.inventory.pico < 1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Necesitas un 'Pico de Hierro' para usar este comando. Cómpralo en la tienda con `buy pico`." }, { quoted: msg });
    }

    const lastMine = user.lastMine || 0;
    const now = Date.now();

    if (now - lastMine < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastMine);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft} minutos más para volver a minar.` }, { quoted: msg });
    }

    // Rewards are now a mix of coins and resources
    const coinEarnings = Math.floor(Math.random() * (40 - 10 + 1)) + 10; // 10-40 coins
    const stoneGained = Math.floor(Math.random() * 5) + 2; // 2-6 stone
    const coalGained = Math.floor(Math.random() * 4) + 1; // 1-4 coal
    const ironGained = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0; // 40% chance of 1-2 iron

    // Update user data
    user.coins = (user.coins || 0) + coinEarnings;
    user.inventory.stone = (user.inventory.stone || 0) + stoneGained;
    user.inventory.coal = (user.inventory.coal || 0) + coalGained;
    if (ironGained > 0) {
      user.inventory.iron = (user.inventory.iron || 0) + ironGained;
    }
    user.lastMine = now;

    writeUsersDb(usersDb);

    // Construct the result message
    let resultMessage = `*⛏️ Sesión de minería completada ⛏️*\n\n` +
                        `Has obtenido:\n` +
                        `💰 *${coinEarnings}* Monedas\n` +
                        `🪨 *${stoneGained}* de Piedra\n` +
                        `⚫ *${coalGained}* de Carbón`;

    if (ironGained > 0) {
      resultMessage += `\n🔩 *${ironGained}* de Hierro`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: resultMessage }, { quoted: msg });
  }
};

export default mineCommand;
