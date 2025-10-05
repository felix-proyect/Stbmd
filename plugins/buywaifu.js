import { readUsersDb, writeUsersDb, readSettingsDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const SHOP_FILE_PATH = './database/gacha_shop.json';

// --- Helper Functions ---
const getCharacters = () => {
  try {
    const data = fs.readFileSync('./lib/characters.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer lib/characters.json:", error);
    return [];
  }
};

const readShopDb = () => {
    try {
        if (!fs.existsSync(SHOP_FILE_PATH)) return {};
        const data = fs.readFileSync(SHOP_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const buyWaifuCommand = {
  name: "buywaifu",
  category: "rpg",
  description: "Compra una waifu de la tienda. Uso: .buywaifu <nombre>",
  aliases: ["comprarwaifu"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const characterNameToBuy = args.join(" ").toLowerCase();

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    if (!characterNameToBuy) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, especifica el nombre de la waifu que quieres comprar de la `.waifushop`." }, { quoted: msg });
    }

    const shop = readShopDb();
    const itemInShop = shop.stock?.find(item => item.name.toLowerCase() === characterNameToBuy);

    if (!itemInShop) {
        return sock.sendMessage(msg.key.remoteJid, { text: `"${args.join(" ")}" no está a la venta en la tienda de hoy.` }, { quoted: msg });
    }

    if ((user.coins || 0) < itemInShop.value) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes WFCoins. Necesitas ${itemInShop.value} para comprar a ${itemInShop.name}.` }, { quoted: msg });
    }

    const alreadyOwned = user.harem.some(w => w.name.toLowerCase() === characterNameToBuy);
    if (alreadyOwned) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Ya tienes a ${itemInShop.name} en tu harén.` }, { quoted: msg });
    }

    const allCharacters = getCharacters();
    const characterData = allCharacters.find(c => c.name.toLowerCase() === characterNameToBuy);

    if (!characterData) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al obtener los datos de la waifu. Inténtalo de nuevo." }, { quoted: msg });
    }

    // Proceder con la compra
    user.coins -= itemInShop.value;

    const newWaifu = {
        ...characterData,
        id: uuidv4()
    };
    user.harem.push(newWaifu);

    writeUsersDb(usersDb);

    const successMessage = `*🛍️ ¡Compra Exitosa! 🛍️*\n\nHas comprado a *${itemInShop.name}* por ${itemInShop.value} WFCoins. ¡Se ha unido a tu harén!`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default buyWaifuCommand;