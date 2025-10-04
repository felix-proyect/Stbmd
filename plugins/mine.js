import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const mineCommand = {
  name: "mine",
  category: "rpg",
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

    // Inicializar datos del usuario para asegurar compatibilidad
    initializeRpgUser(user);

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

    user.lastMine = now;

    // --- Rewards Calculation ---
    const isMiner = user.profession === 'miner';
    let professionBonusMessage = "";

    let coinEarnings = Math.floor(Math.random() * (40 - 10 + 1)) + 10;
    let stoneGained = Math.floor(Math.random() * 5) + 2;
    let coalGained = Math.floor(Math.random() * 4) + 1;

    // Base chances
    let ironChance = 0.6; // 40%
    let goldChance = 0.9; // 10%
    let mithrilChance = 0.98; // 2%

    if (isMiner) {
        stoneGained = Math.floor(stoneGained * 1.5);
        coalGained = Math.floor(coalGained * 1.5);
        ironChance = 0.4; // 60%
        goldChance = 0.8; // 20%
        mithrilChance = 0.95; // 5%
        professionBonusMessage = "\n\n*¡Tu habilidad de Minero te ha ayudado a encontrar más recursos!*";
    }

    const ironGained = Math.random() > ironChance ? Math.floor(Math.random() * 2) + 1 : 0;
    const goldGained = Math.random() > goldChance ? 1 : 0;
    const mithrilGained = Math.random() > mithrilChance ? 1 : 0;

    // Update user data
    user.coins = (user.coins || 0) + coinEarnings;
    user.inventory.stone = (user.inventory.stone || 0) + stoneGained;
    user.inventory.coal = (user.inventory.coal || 0) + coalGained;
    if (ironGained > 0) user.inventory.iron = (user.inventory.iron || 0) + ironGained;
    if (goldGained > 0) user.inventory.gold = (user.inventory.gold || 0) + goldGained;
    if (mithrilGained > 0) user.inventory.mithril = (user.inventory.mithril || 0) + mithrilGained;

    writeUsersDb(usersDb);

    // --- Construct the result message ---
    let resultMessage = `*⛏️ Sesión de minería completada ⛏️*\n\n` +
                        `Has obtenido:\n` +
                        `💰 *${coinEarnings}* Monedas\n` +
                        `🪨 *${stoneGained}* de Piedra\n` +
                        `⚫ *${coalGained}* de Carbón`;

    if (ironGained > 0) resultMessage += `\n🔩 *${ironGained}* de Hierro`;
    if (goldGained > 0) resultMessage += `\n🌟 *${goldGained}* de Oro`;
    if (mithrilGained > 0) resultMessage += `\n✨ *${mithrilGained}* de Mithril`;

    resultMessage += professionBonusMessage;

    await sock.sendMessage(msg.key.remoteJid, { text: resultMessage }, { quoted: msg });
  }
};

export default mineCommand;