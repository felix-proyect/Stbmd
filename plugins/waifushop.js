import { readUsersDb, writeUsersDb, readSettingsDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';
import fs from 'fs';

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
        console.error("Error al leer la base de datos de la tienda:", error);
        return {};
    }
};

const writeShopDb = (data) => {
    try {
        fs.writeFileSync(SHOP_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error al escribir en la base de datos de la tienda:", error);
    }
};

const refreshShopIfNeeded = () => {
    const shop = readShopDb();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (shop.lastUpdated !== today) {
        const allCharacters = getCharacters();
        const stock = [];
        const numItemsInShop = 5;

        // Seleccionar 5 personajes aleatorios para la tienda
        for (let i = 0; i < numItemsInShop; i++) {
            const randomIndex = Math.floor(Math.random() * allCharacters.length);
            const character = allCharacters[randomIndex];
            if (!stock.some(s => s.name === character.name)) {
                stock.push({
                    name: character.name,
                    value: Math.floor(character.value * 1.5) // Precio de tienda un 50% más caro
                });
            }
        }

        shop.stock = stock;
        shop.lastUpdated = today;
        writeShopDb(shop);
    }
    return shop;
};


const waifuShopCommand = {
  name: "waifushop",
  category: "rpg",
  description: "Muestra las waifus disponibles en la tienda de hoy.",
  aliases: ["tienda", "shop"],

  async execute({ sock, msg }) {
    const shop = refreshShopIfNeeded();

    if (!shop.stock || shop.stock.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "La tienda está vacía en este momento. ¡Vuelve más tarde!" }, { quoted: msg });
    }

    let shopMessage = `*🏪 Tienda de Waifus 🏪*\n\n¡Estos son los personajes disponibles hoy! Usa \`.buywaifu <nombre>\` para comprar.\n\n`;

    shop.stock.forEach((item, index) => {
        shopMessage += `${index + 1}. *${item.name}*\n` +
                       `   - Precio: ${item.value} WFCoins\n\n`;
    });

    await sock.sendMessage(msg.key.remoteJid, { text: shopMessage.trim() }, { quoted: msg });
  }
};

export default waifuShopCommand;