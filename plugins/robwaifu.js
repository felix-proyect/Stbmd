import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser, getUserFromMessage } from '../lib/utils.js';

const robWaifuCommand = {
  name: "robwaifu",
  category: "gacha",
  description: "Intenta robar una waifu aleatoria de otro usuario. ¡Es muy arriesgado!",
  aliases: ["robarwaifu"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG." }, { quoted: msg });
    }
    initializeRpgUser(user);

    const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora de cooldown
    const lastRob = user.lastRobWaifu || 0;
    const now = Date.now();

    if (now - lastRob < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastRob);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas planear tu próximo golpe. Espera ${minutesLeft} minutos.` }, { quoted: msg });
    }

    const targetId = getUserFromMessage(msg, args);
    if (!targetId || !usersDb[targetId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario válido del grupo para robarle." }, { quoted: msg });
    }

    if (targetId === senderId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No puedes robarte a ti mismo." }, { quoted: msg });
    }

    const targetUser = usersDb[targetId];
    initializeRpgUser(targetUser);

    if (!targetUser.harem || targetUser.harem.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "La víctima no tiene ninguna waifu en su harén. No hay nada que robar." }, { quoted: msg });
    }

    user.lastRobWaifu = now;

    const successChance = 0.15; // 15% de probabilidad de éxito
    const roll = Math.random();

    if (roll < successChance) {
      const randomIndex = Math.floor(Math.random() * targetUser.harem.length);
      const [stolenWaifu] = targetUser.harem.splice(randomIndex, 1);
      user.harem.push(stolenWaifu);

      writeUsersDb(usersDb);

      const successMessage = `*🎭 ¡Robo Maestro! 🎭*\n\n¡En un movimiento audaz, has robado a *${stolenWaifu.name}* del harén de @${targetId.split('@')[0]}!`;
      return sock.sendMessage(msg.key.remoteJid, { text: successMessage, mentions: [targetId] });
    } else {
      const finePercentage = 0.25; // Multa del 25% de tus monedas
      const fine = Math.floor(user.coins * finePercentage);
      user.coins -= fine;

      writeUsersDb(usersDb);

      const failureMessage = `*👮 ¡Te Atraparon! 👮*\n\nTu intento de robo ha fallado estrepitosamente. Has sido multado con *${fine}* WFCoins por tu torpeza.`;
      return sock.sendMessage(msg.key.remoteJid, { text: failureMessage }, { quoted: msg });
    }
  }
};

export default robWaifuCommand;