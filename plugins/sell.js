import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

// Precios de venta de los recursos
const sellPrices = {
  wood: 2,
  stone: 1,
  fish: 5,
  berries: 3,
  herbs: 4,
  iron: 15,
  gold: 50,
  mithril: 200,
  diamonds: 100,
};

const sellCommand = {
  name: "sell",
  category: "rpg",
  description: "Vende tus recursos por monedas. Uso: .sell <item> <cantidad>",
  aliases: ["vender"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    initializeRpgUser(user);

    const itemToSell = args[0]?.toLowerCase();
    const amountToSell = args[1] === 'all' ? 'all' : parseInt(args[1], 10);

    if (!itemToSell || !sellPrices[itemToSell]) {
      const availableItems = Object.keys(sellPrices).map(item => `\`${item}\``).join(', ');
      return sock.sendMessage(msg.key.remoteJid, { text: `No puedes vender ese objeto. Objetos vendibles: ${availableItems}` }, { quoted: msg });
    }

    if (isNaN(amountToSell) && amountToSell !== 'all' || (amountToSell !== 'all' && amountToSell <= 0)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, especifica una cantidad válida para vender o usa 'all' para vender todo." }, { quoted: msg });
    }

    const userAmount = user.inventory[itemToSell] || 0;

    if (userAmount === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes ${itemToSell} para vender.` }, { quoted: msg });
    }

    const finalAmount = amountToSell === 'all' ? userAmount : amountToSell;

    if (userAmount < finalAmount) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Solo tienes ${userAmount} de ${itemToSell} para vender.` }, { quoted: msg });
    }

    const pricePerItem = sellPrices[itemToSell];
    const totalEarnings = pricePerItem * finalAmount;

    user.inventory[itemToSell] -= finalAmount;
    user.coins = (user.coins || 0) + totalEarnings;

    writeUsersDb(usersDb);

    const successMessage = `*📈 Venta Exitosa 📈*\n\nVendiste *${finalAmount}* de ${itemToSell} por un total de *${totalEarnings}* monedas.`;
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default sellCommand;