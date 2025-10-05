import { readUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';
import fs from 'fs';

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

const waifuInfoCommand = {
  name: "waifuinfo",
  category: "rpg",
  description: "Muestra información detallada de una waifu. Uso: .waifuinfo <nombre>",
  aliases: ["winfo"],

  async execute({ sock, msg, args }) {
    const characterName = args.join(" ").toLowerCase();

    if (!characterName) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, especifica el nombre de la waifu que quieres ver." }, { quoted: msg });
    }

    const allCharacters = getCharacters();
    const character = allCharacters.find(c => c.name.toLowerCase() === characterName);

    if (!character) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No se encontró ninguna waifu con el nombre "${args.join(" ")}".` }, { quoted: msg });
    }

    const caption = `*✨ Detalles de la Waifu ✨*\n\n` +
                    `*Nombre:* ${character.name}\n` +
                    `*Valor:* ${character.value} WFCoins`;

    await sock.sendMessage(msg.key.remoteJid, {
        image: { url: character.url },
        caption: caption
    }, { quoted: msg });
  }
};

export default waifuInfoCommand;