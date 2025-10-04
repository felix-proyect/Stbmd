import { readUsersDb } from '../lib/database.js';
import { shopItems } from '../lib/shop-items.js';
import { initializeRpgUser } from '../lib/utils.js';

// Define a map for resources to give them pretty names and emojis
const resourceMap = {
  wood: { name: 'Madera', emoji: '🪵' },
  stone: { name: 'Piedra', emoji: '🪨' },
  coal: { name: 'Carbón', emoji: '⚫' },
  iron: { name: 'Hierro', emoji: '🔩' },
  gold: { name: 'Oro', emoji: '🌟' },
  mithril: { name: 'Mithril', emoji: '✨' },
  diamonds: { name: 'Diamantes', emoji: '💎' }
};

// A map for equipment names, as they are not "shop items"
const equipmentNameMap = {
    sword: "Espada de Hierro",
    armor: "Armadura de Hierro",
    gilded_sword: "Espada Dorada",
    mithril_armor: "Armadura de Mithril"
};

const inventoryCommand = {
  name: "inventory",
  category: "rpg",
  description: "Muestra los artículos y recursos que posees.",
  aliases: ["inv"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Inicializar datos del usuario para asegurar compatibilidad
    initializeRpgUser(user);

    const hasInventory = user.inventory && Object.keys(user.inventory).some(key => user.inventory[key] > 0);
    const hasEquipment = user.equipment && Object.keys(user.equipment).length > 0;

    if (!hasInventory && !hasEquipment) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Tu inventario y equipamiento están vacíos." }, { quoted: msg });
    }

    let finalMessage = "🎒 *Tu Inventario*\n\n";
    let equipmentMessage = "🗡️ *Equipamiento*\n\n";
    let itemsMessage = "🏷️ *Artículos*\n\n";
    let resourcesMessage = "🧱 *Recursos*\n\n";

    let hasShownEquipment = false;
    let hasShownItems = false;
    let hasShownResources = false;

    // 1. Display Equipment
    if (hasEquipment) {
        for (const itemType in user.equipment) {
            const item = user.equipment[itemType];
            // SOLUCIÓN: Comprobar si el item no es null antes de intentar mostrarlo
            if (item) {
                const itemName = equipmentNameMap[itemType] || "Objeto Desconocido";
                equipmentMessage += `*${itemName} (Nivel ${item.level})*\n`;
                if (item.attack) equipmentMessage += `> Ataque: +${item.attack}\n`;
                if (item.defense) equipmentMessage += `> Defensa: +${item.defense}\n`;
                equipmentMessage += `> Durabilidad: ${item.durability}/${item.maxDurability}\n\n`;
                hasShownEquipment = true;
            }
        }
    }

    // 2. Display Inventory (Items and Resources)
    if (hasInventory) {
        for (const itemId in user.inventory) {
          const quantity = user.inventory[itemId];
          if (!quantity || quantity === 0) continue;

          const shopItem = shopItems.find(i => i.id === itemId);
          if (shopItem) {
            itemsMessage += `*${shopItem.name}* x${quantity}\n`;
            itemsMessage += `> _${shopItem.description}_\n\n`;
            hasShownItems = true;
          } else if (resourceMap[itemId]) {
            const resource = resourceMap[itemId];
            resourcesMessage += `${resource.emoji} *${resource.name}:* ${quantity}\n`;
            hasShownResources = true;
          }
        }
    }

    if (hasShownEquipment) finalMessage += equipmentMessage;
    if (hasShownItems) finalMessage += itemsMessage;
    if (hasShownResources) finalMessage += resourcesMessage;

    await sock.sendMessage(msg.key.remoteJid, { text: finalMessage.trim() }, { quoted: msg });
  }
};

export default inventoryCommand;