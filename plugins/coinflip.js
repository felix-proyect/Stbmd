import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./database/users.json');
const PLAY_REWARD = 5;

function readUsersDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) { 
    return {}; 
  }
}

function writeUsersDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) { 
    console.error("⚠️ Error escribiendo en la DB de usuarios:", error); 
  }
}

const coinflipCommand = {
  name: "coinflip",
  category: "juegos",
  description: "Lanza una moneda al aire y gana monedas.",
  aliases: ["caraocruz"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    // Determinar resultado
    const result = Math.random() < 0.5 ? "Cara" : "Cruz";
    const emoji = result === "Cara" ? "🙂" : "❌";

    // Recompensa si existe el usuario
    let rewardText = "";
    if (user) {
      user.coins += PLAY_REWARD;
      writeUsersDb(usersDb);
      rewardText = `\n💰 *+${PLAY_REWARD} coins* por jugar.`;
    }

    // Decoraciones
    const bordersTop = "╭─🌟─╮";
    const bordersBottom = "╰─🌟─╯";
    const lineSep = "✨━━━━━━━━✨";

    const messages = [
      "🎲 ¡Hora del juego de la moneda! 🎲",
      "💫 Lanza la suerte y mira el resultado 💫",
      "🌈 Cara o Cruz... ¿Qué te deparará? 🌈"
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    // Mensaje final decorado
    const finalMessage = `
${bordersTop}
${randomMsg}
${lineSep}
🪙 Resultado: *${result}* ${emoji}${rewardText}
${lineSep}
¡Gracias por jugar y ganar monedas! 🎉
${bordersBottom}
`;

    await sock.sendMessage(msg.key.remoteJid, { text: finalMessage.trim() }, { quoted: msg });
  }
};

export default coinflipCommand;
