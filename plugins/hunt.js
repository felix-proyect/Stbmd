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

    // --- Calculate total strength including equipment bonuses ---
    let totalStrength = user.strength;
    if (user.equipment && user.equipment.sword) {
      totalStrength += user.equipment.sword.attack;
    }

    const xpGained = Math.floor(Math.random() * 30) + 10; // 10-40 XP
    user.xp += xpGained;

    let lootMessage = `Ganaste *${xpGained} XP* por la cacería.\n`;

    // The hunt's success is now influenced by strength
    const successChance = 0.5 + (totalStrength / 100); // Base 50% chance, +1% per 1 strength
    const lootRoll = Math.random();

    if (lootRoll < successChance) {
      const coinsGained = Math.floor(Math.random() * (20 + totalStrength)) + 10; // Better strength, better coins
      user.coins += coinsGained;
      lootMessage += `¡Cacería exitosa! Atrapaste a tu presa y ganaste *${coinsGained} monedas*.`;
    } else {
      lootMessage += `La criatura era demasiado fuerte y escapó. ¡Necesitas más fuerza!`;
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🏹 *De Cacería...*\n\n${lootMessage}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default huntCommand;
