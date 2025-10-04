import { readUsersDb } from '../lib/database.js';
import { shopItems } from '../lib/shop-items.js';

// Define a map for resources to give them pretty names and emojis
const resourceMap = {
  wood: { name: 'Madera', emoji: '🪵' },
  stone: { name: 'Piedra', emoji: '🪨' },
  coal: { name: 'Carbón', emoji: '⚫' },
  iron: { name: 'Hierro', emoji: '🔩' },
  diamonds: { name: 'Diamantes', emoji: '💎' }
};

const inventoryCommand = {
  name: "inventory",
  category: "economia",
  description: "Muestra los artículos y recursos que posees.",
  aliases: ["inv"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    if (!user.inventory || Object.keys(user.inventory).every(key => user.inventory[key] === 0)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Tu inventario está vacío." }, { quoted: msg });
    }

    let itemsMessage = "🏷️ *Artículos*\n\n";
    let resourcesMessage = "🧱 *Recursos*\n\n";
    let hasItems = false;
    let hasResources = false;

    for (const itemId in user.inventory) {
      const quantity = user.inventory[itemId];
      if (!quantity || quantity === 0) continue; // Skip items with 0 quantity

      // Check if it's a shop item
      const shopItem = shopItems.find(i => i.id === itemId);
      if (shopItem) {
        itemsMessage += `*${shopItem.name}* x${quantity}\n`;
        itemsMessage += `> _${shopItem.description}_\n\n`;
        hasItems = true;
      }
      // Check if it's a resource
      else if (resourceMap[itemId]) {
        const resource = resourceMap[itemId];
        resourcesMessage += `${resource.emoji} *${resource.name}:* ${quantity}\n`;
        hasResources = true;
      }
    }

    let finalMessage = "🎒 *Tu Inventario*\n\n";
    if (!hasItems && !hasResources) {
      finalMessage = "Tu inventario está vacío.";
    } else {
      if (hasItems) finalMessage += itemsMessage;
      if (hasResources) finalMessage += `\n${resourcesMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: finalMessage.trim() }, { quoted: msg });
  }
};

export default inventoryCommand;