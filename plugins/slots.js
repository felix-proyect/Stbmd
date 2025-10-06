import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const slotsCommand = {
  name: "slots",
  category: "rpg",
  description: "Juega a la máquina tragaperras. Uso: .slots <apuesta>",
  aliases: ["tragamonedas"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const betAmount = parseInt(args[0], 10);

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }
    initializeRpgUser(user);

    if (isNaN(betAmount) || betAmount <= 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes especificar una cantidad válida para apostar." }, { quoted: msg });
    }
    if (user.coins < betAmount) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas para apostar ${betAmount}.` }, { quoted: msg });
    }

    const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '⭐', '💎', '7️⃣'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

    let resultMessage = `*🎰 Máquina Tragamonedas 🎰*\n\n` +
                        `[ ${reel1} | ${reel2} | ${reel3} ]\n\n`;

    let win = false;
    let payout = 0;

    if (reel1 === reel2 && reel2 === reel3) {
      win = true;
      if (reel1 === '7️⃣') {
        payout = betAmount * 10;
        resultMessage += `*¡JACKPOT!* ¡Has ganado 10 veces tu apuesta!`;
      } else if (reel1 === '💎') {
        payout = betAmount * 7;
        resultMessage += `*¡INCREÍBLE!* ¡Has ganado 7 veces tu apuesta!`;
      } else {
        payout = betAmount * 3;
        resultMessage += `¡Has ganado 3 veces tu apuesta!`;
      }
    } else if (reel1 === reel2 || reel2 === reel3) {
      win = true;
      payout = betAmount * 2;
      resultMessage += `¡Has ganado el doble de tu apuesta!`;
    } else {
      resultMessage += `¡Mala suerte! Has perdido ${betAmount} monedas.`;
    }

    if (win) {
      user.coins += payout;
      resultMessage += `\n*Ganancia:* +${payout} monedas.`;
    } else {
      user.coins -= betAmount;
    }

    writeUsersDb(usersDb);

    await sock.sendMessage(msg.key.remoteJid, { text: resultMessage }, { quoted: msg });
  }
};

export default slotsCommand;