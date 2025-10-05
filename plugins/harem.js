import { readUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const haremCommand = {
  name: "harem",
  category: "gacha",
  description: "Muestra tu colección de waifus obtenidas.",
  aliases: ["mywaifus", "collection"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    if (!user.harem || user.harem.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ninguna waifu en tu harén. ¡Usa el comando `.gacha` para conseguir una!" }, { quoted: msg });
    }

    let haremList = `*💖 Tu Harén de Waifus 💖*\n\n`;
    haremList += `Has coleccionado *${user.harem.length}* waifu(s):\n\n`;

    user.harem.forEach((waifu, index) => {
      // Asignar un ID si la waifu no lo tiene (para compatibilidad con colecciones antiguas)
      if (!waifu.id) {
          waifu.id = `old-${index + 1}`; // ID temporal para waifus antiguas
      }
      haremList += `${index + 1}. *${waifu.name}*\n` +
                   `   - Valor: ${waifu.value} WFCoins\n` +
                   `   - ID: \`${waifu.id}\`\n\n`;
    });

    haremList += `Usa el ID para vender, intercambiar o marcar como favorita a tu waifu.`;

    await sock.sendMessage(msg.key.remoteJid, { text: haremList.trim() }, { quoted: msg });
  }
};

export default haremCommand;