import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

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

    // Inicializar datos del usuario para asegurar compatibilidad
    initializeRpgUser(user);

    if (user.hp <= 0) {
        user.hp = 0; // Asegurarse de que no sea negativo
        return sock.sendMessage(msg.key.remoteJid, { text: "Estás demasiado débil para cazar. Usa el comando `.heal` para recuperarte." }, { quoted: msg });
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
    let totalDefense = user.defense;
    let durabilityMessage = "";
    const durabilityLoss = 3;

    if (user.equipment) {
        for (const itemType in user.equipment) {
            const item = user.equipment[itemType];
            if (item && item.durability > 0) { // CRITICAL FIX: Check if item is not null
                if (item.attack) totalStrength += item.attack;
                if (item.defense) totalDefense += item.defense;

                item.durability -= durabilityLoss;
                if (item.durability <= 0) {
                    item.durability = 0;
                    durabilityMessage += `\n*¡Tu equipo (${itemType}) se ha roto!*`;
                }
            }
        }
    }

    const xpGained = Math.floor(Math.random() * 25) + 15;
    user.xp += xpGained;

    let lootMessage = `Ganaste *${xpGained} XP* por la cacería.\n`;

    // --- Monster & Combat Logic ---
    const monsterLevel = Math.max(1, user.level + Math.floor(Math.random() * 5 - 2));
    const monsterPower = monsterLevel * 8 + Math.floor(Math.random() * 10);
    const playerPower = totalStrength + (totalDefense / 2);

    if (playerPower > monsterPower) {
        const coinsGained = Math.floor(Math.random() * (15 + totalStrength)) + 10;
        user.coins = (user.coins || 0) + coinsGained;
        lootMessage += `¡Cacería exitosa! Venciste a la criatura y ganaste *${coinsGained} monedas*.`;
    } else {
        const damageTaken = Math.max(1, Math.floor(monsterPower / 4 - totalDefense / 2));
        user.hp = Math.max(0, user.hp - damageTaken);

        lootMessage += `¡La criatura te ha herido! Perdiste *${damageTaken} HP*.\n`+
                       `> Te quedan ${user.hp}/${user.maxHp} de vida.`;

        if (user.hp <= 0) {
            const xpPenalty = Math.floor(user.xp * 0.1);
            user.xp = Math.max(0, user.xp - xpPenalty);
            user.hp = 1; // Revive with 1 HP
            lootMessage += `\n\n*¡Has sido derrotado!* Pierdes *${xpPenalty} XP* y te quedas con 1 HP.`;
        }
    }

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