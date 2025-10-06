import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const dungeonCommand = {
  name: "dungeon",
  category: "rpg",
  description: "Adéntrate en una peligrosa mazmorra para luchar contra monstruos y obtener grandes recompensas.",
  aliases: ["mazmorra"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }
    initializeRpgUser(user);

    const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas de cooldown
    const lastDungeon = user.lastDungeon || 0;
    const now = Date.now();

    if (now - lastDungeon < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastDungeon);
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Aún estás recuperándote de tu última incursión. Podrás entrar a otra mazmorra en ${hoursLeft}h y ${minutesLeft}m.` }, { quoted: msg });
    }

    if (user.hp < user.maxHp * 0.5) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Estás demasiado herido para entrar en una mazmorra. Necesitas al menos el 50% de tu HP. ¡Cúrate!` }, { quoted: msg });
    }

    user.lastDungeon = now;

    const floors = 5;
    let currentFloor = 1;
    let totalCoinsGained = 0;
    let totalXpGained = 0;
    let combatLog = `*🕯️ Entrando a la Mazmorra... 🕯️*\n\n`;

    while (currentFloor <= floors && user.hp > 0) {
      const monsterPower = (user.level * 5) + (currentFloor * 10) + (Math.floor(Math.random() * 20));
      const playerPower = user.strength + user.defense;

      combatLog += `*Piso ${currentFloor}/${floors}:*\n`;

      if (playerPower > monsterPower) {
        const floorCoins = 50 * currentFloor;
        const floorXp = 30 * currentFloor;
        totalCoinsGained += floorCoins;
        totalXpGained += floorXp;

        combatLog += `> ✅ Has derrotado al guardián. Ganas ${floorCoins} monedas y ${floorXp} XP.\n\n`;
        currentFloor++;
      } else {
        const damageTaken = Math.floor(monsterPower / 3 - user.defense / 2);
        user.hp = Math.max(0, user.hp - damageTaken);

        combatLog += `> ❌ El guardián te ha herido. Pierdes ${damageTaken} HP.\n`+
                     `> Te quedan ${user.hp}/${user.maxHp} HP.\n\n`;
        break; // El jugador es derrotado y sale de la mazmorra
      }
    }

    user.coins += totalCoinsGained;
    user.xp += totalXpGained;

    if (user.hp <= 0) {
        combatLog += `*💀 Has sido derrotado y escapas de la mazmorra!*`;
        user.hp = 1; // Queda con 1 de vida
    } else if (currentFloor > floors) {
        combatLog += `*🏆 ¡Felicidades! 🏆*\n\n¡Has conquistado todos los pisos de la mazmorra!\n\n` +
                     `*Recompensa Total:*\n` +
                     `> 💰 ${totalCoinsGained} Monedas\n` +
                     `> ✨ ${totalXpGained} XP`;
    } else {
        combatLog += `*🏃‍♂️ Escapas de la mazmorra con tus ganancias...*\n\n`+
                     `*Botín Obtenido:*\n` +
                     `> 💰 ${totalCoinsGained} Monedas\n` +
                     `> ✨ ${totalXpGained} XP`;
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: combatLog.trim() }, { quoted: msg });
  }
};

export default dungeonCommand;