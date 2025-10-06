import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const trainCommand = {
  name: "train",
  category: "rpg",
  description: "Entrena tus estadísticas para volverte más fuerte. Uso: .train <fuerza|defensa>",
  aliases: ["entrenar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const statToTrain = args[0]?.toLowerCase();

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    if (!statToTrain || (statToTrain !== 'fuerza' && statToTrain !== 'defensa')) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Debes especificar qué estadística quieres entrenar: `fuerza` o `defensa`." }, { quoted: msg });
    }

    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos
    const lastTrain = user.lastTrain || 0;
    const now = Date.now();

    if (now - lastTrain < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastTrain);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas descansar. Vuelve a entrenar en ${minutesLeft} minutos.` }, { quoted: msg });
    }

    const baseCost = 100;
    const currentStatValue = user[statToTrain === 'fuerza' ? 'strength' : 'defense'];
    const cost = baseCost + (currentStatValue * 20); // El costo aumenta con el nivel de la estadística

    if (user.coins < cost) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas para entrenar. Necesitas ${cost} WFCoins.` }, { quoted: msg });
    }

    user.coins -= cost;
    user.lastTrain = now;

    let statGain = 1;
    let statNameSpanish = "";

    if (statToTrain === 'fuerza') {
        user.strength += statGain;
        statNameSpanish = "Fuerza";
    } else {
        user.defense += statGain;
        statNameSpanish = "Defensa";
    }

    writeUsersDb(usersDb);

    const successMessage = `*💪 Entrenamiento Completado 💪*\n\n` +
                           `Has pagado ${cost} WFCoins y has entrenado duro.\n` +
                           `¡Tu *${statNameSpanish}* ha aumentado en +${statGain}!`;

    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default trainCommand;