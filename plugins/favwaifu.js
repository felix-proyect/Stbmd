import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const favWaifuCommand = {
  name: "favwaifu",
  category: "gacha",
  description: "Marca una waifu de tu harén como tu favorita. Uso: .favwaifu <ID>",
  aliases: ["favorite", "fav"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const waifuIdToFav = args[0];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG." }, { quoted: msg });
    }

    initializeRpgUser(user);

    if (!waifuIdToFav) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el ID de la waifu que quieres marcar como favorita. Puedes ver los IDs en tu `.harem`." }, { quoted: msg });
    }

    if (waifuIdToFav.toLowerCase() === 'none' || waifuIdToFav.toLowerCase() === 'ninguna') {
        user.favoriteWaifuId = null;
        writeUsersDb(usersDb);
        return sock.sendMessage(msg.key.remoteJid, { text: "💔 Has quitado a tu waifu favorita." }, { quoted: msg });
    }

    const waifu = user.harem.find(w => w.id === waifuIdToFav);

    if (!waifu) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró ninguna waifu con ese ID en tu harén." }, { quoted: msg });
    }

    user.favoriteWaifuId = waifu.id;
    writeUsersDb(usersDb);

    const successMessage = `*❤️ Waifu Favorita ❤️*\n\n¡Has marcado a *${waifu.name}* como tu nueva waifu favorita! Se mostrará en tu perfil.`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default favWaifuCommand;