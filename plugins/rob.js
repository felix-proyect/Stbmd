import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser, getUserFromMessage } from '../lib/utils.js';

const robCommand = {
  name: "rob",
  category: "rpg",
  description: "Intenta robarle monedas a otro usuario. ¡Cuidado, puedes fallar y pagar una multa!",
  aliases: ["robar"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos
    const lastRob = user.lastRob || 0;
    const now = Date.now();

    if (now - lastRob < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastRob);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Has llamado mucho la atención. Espera ${minutesLeft} minutos antes de volver a robar.` }, { quoted: msg });
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

    user.lastRob = now;

    const successChance = 0.40; // 40% de probabilidad de éxito
    const roll = Math.random();

    if (roll < successChance) {
      const maxRobAmount = Math.floor(targetUser.coins * 0.15); // Robar hasta el 15%
      if (maxRobAmount <= 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "La víctima no tiene monedas para robar." }, { quoted: msg });
      }
      const amountStolen = Math.floor(Math.random() * maxRobAmount) + 1;

      user.coins += amountStolen;
      targetUser.coins -= amountStolen;
      writeUsersDb(usersDb);

      const successMessage = `*💰 ¡Robo Exitoso! 💰*\n\nTe escabulliste y lograste robar *${amountStolen}* monedas.`;
      return sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });

    } else {
      const fine = Math.floor(user.coins * 0.10); // Multa del 10% de tus monedas
      user.coins -= fine;
      writeUsersDb(usersDb);

      const failureMessage = `*🚨 ¡Robo Fallido! 🚨*\n\nTe atraparon y tuviste que pagar una multa de *${fine}* monedas.`;
      return sock.sendMessage(msg.key.remoteJid, { text: failureMessage }, { quoted: msg });
    }
  }
};

export default robCommand;