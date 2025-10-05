import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// --- Helper functions ---
const getCharacters = () => {
  try {
    const data = fs.readFileSync('./lib/characters.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer lib/characters.json:", error);
    return [];
  }
};

const gachaCommand = {
  name: "gacha",
  category: "gacha",
  description: "Obtén una waifu aleatoria para tu harén.",
  aliases: ["roll", "waifu"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);
    if (!user.harem) {
        user.harem = []; // Asegurarse de que el harén exista
    }

    const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos
    const lastGacha = user.lastGacha || 0;
    const now = Date.now();

    if (now - lastGacha < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastGacha);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft} minutos para volver a usar el gacha.` }, { quoted: msg });
    }

    const allCharacters = getCharacters();
    const userCharacterUrls = new Set(user.harem.map(c => c.url));
    const availableCharacters = allCharacters.filter(c => !userCharacterUrls.has(c.url));

    if (availableCharacters.length === 0) {
      const allObtainedMessage = "¡Felicidades! Has obtenido todas las waifus disponibles en el gacha. ¡Pronto habrá más!";
      return sock.sendMessage(msg.key.remoteJid, { text: allObtainedMessage }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎲", key: msg.key } });

    const character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];

    // Crear una instancia única de la waifu con un ID
    const newWaifu = {
        ...character,
        id: uuidv4() // Asignar un ID único
    };

    user.harem.push(newWaifu);
    user.lastGacha = now;
    writeUsersDb(usersDb);

    const caption = `*🎉 ¡Nueva Waifu Obtenida! 🎉*\n\n` +
                    `*Nombre:* ${newWaifu.name}\n` +
                    `*Valor:* ${newWaifu.value} WFCoins\n` +
                    `*ID:* \`${newWaifu.id}\`\n\n` +
                    `¡Ahora forma parte de tu harén! Usa \`.harem\` para ver tu colección.`;

    await sock.sendMessage(msg.key.remoteJid, {
        image: { url: character.url },
        caption: caption
    }, { quoted: msg });
  }
};

export default gachaCommand;