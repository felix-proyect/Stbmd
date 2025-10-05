import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const sellWaifuCommand = {
  name: "sellwaifu",
  category: "rpg",
  description: "Vende una waifu de tu harén por su valor en WFCoins. Uso: .sellwaifu <ID>",
  aliases: ["venderwaifu"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const waifuIdToSell = args[0];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    if (!waifuIdToSell) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el ID de la waifu que quieres vender. Puedes ver los IDs en tu `.harem`." }, { quoted: msg });
    }

    const waifuIndex = user.harem.findIndex(w => w.id === waifuIdToSell);

    if (waifuIndex === -1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró ninguna waifu con ese ID en tu harén." }, { quoted: msg });
    }

    const [soldWaifu] = user.harem.splice(waifuIndex, 1);
    const earnings = soldWaifu.value;
    user.coins = (user.coins || 0) + earnings;

    writeUsersDb(usersDb);

    const successMessage = `*💸 Venta Exitosa 💸*\n\nHas vendido a *${soldWaifu.name}* por *${earnings}* WFCoins.`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default sellWaifuCommand;