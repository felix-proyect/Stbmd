import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const huntCommand = {
  name: "hunt",
  category: "rpg",
  description: "Caza criaturas en la naturaleza para obtener recompensas.",
  aliases: ["cazar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const lastHunt = user.lastHunt || 0;
    const now = Date.now();

    if (now - lastHunt < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastHunt);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft}m para volver a cazar.` }, { quoted: msg });
    }

    user.lastHunt = now;

    // --- Combat Calculation ---
    let totalStrength = user.strength;
    let durabilityMessage = "";
    const durabilityLoss = 2; // Each item loses 2 durability per hunt

    if (user.equipment) {
        for (const itemType in user.equipment) {
            const item = user.equipment[itemType];

            // Only consider items with durability and relevant stats
            if (item.durability > 0) {
                if (item.attack) {
                    totalStrength += item.attack;
                }

                // Decrease durability
                item.durability -= durabilityLoss;
                if (item.durability <= 0) {
                    item.durability = 0; // Prevent negative durability
                    durabilityMessage += `\n*¡Tu ${itemType} se ha roto!* Repáralo en la herrería.`;
                }
            }
        }
    }

    const xpGained = Math.floor(Math.random() * 30) + 10; // 10-40 XP
    user.xp += xpGained;

    let lootMessage = `Ganaste *${xpGained} XP* por la cacería.\n`;

    // The hunt's success is influenced by strength
    const successChance = 0.5 + (totalStrength / 120); // Base 50% chance, scaled
    const lootRoll = Math.random();

    if (lootRoll < successChance) {
      const coinsGained = Math.floor(Math.random() * (20 + totalStrength)) + 10;
      user.coins += coinsGained;
      lootMessage += `¡Cacería exitosa! Atrapaste a tu presa y ganaste *${coinsGained} monedas*.`;
    } else {
      lootMessage += `La criatura era demasiado fuerte y escapó. ¡Necesitas más fuerza!`;
    }

    // Add durability message if any item broke
    if (durabilityMessage) {
        lootMessage += `\n${durabilityMessage}`;
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🏹 *De Cacería...*\n\n${lootMessage.trim()}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default huntCommand;
