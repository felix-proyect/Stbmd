import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

// --- Item Configuration ---
const itemConfig = {
  sword: {
    name: "Espada",
    baseAttack: 5,
    attackPerLevel: 3,
    baseDurability: 100,
    durabilityPerLevel: 20,
    craftCost: { stone: 20, coal: 10, iron: 10 },
    getUpgradeCost: (level) => ({
      stone: 20 * level,
      coal: 10 * level,
      iron: 10 * level,
      diamonds: Math.max(0, level - 2),
    }),
    getRepairCost: (missingDurability) => ({
        stone: Math.ceil(missingDurability / 4),
        iron: Math.ceil(missingDurability / 8),
    }),
  },
  armor: {
    name: "Armadura",
    baseDefense: 5,
    defensePerLevel: 3,
    baseDurability: 150,
    durabilityPerLevel: 30,
    craftCost: { iron: 30, coal: 15 },
    getUpgradeCost: (level) => ({
      iron: 30 * level,
      coal: 15 * level,
      diamonds: Math.max(0, level - 1),
    }),
    getRepairCost: (missingDurability) => ({
        stone: Math.ceil(missingDurability / 2),
        iron: Math.ceil(missingDurability / 4),
    }),
  },
  gilded_sword: {
    name: "Espada Dorada",
    baseAttack: 15,
    attackPerLevel: 5,
    baseDurability: 120,
    durabilityPerLevel: 25,
    craftCost: { iron: 20, gold: 5, diamonds: 1 },
    getUpgradeCost: (level) => ({
      iron: 20 * level,
      gold: 5 * level,
      diamonds: 1 * level,
    }),
    getRepairCost: (missingDurability) => ({
        iron: Math.ceil(missingDurability / 5),
        gold: Math.ceil(missingDurability / 10),
    }),
  },
  mithril_armor: {
    name: "Armadura de Mithril",
    baseDefense: 20,
    defensePerLevel: 7,
    baseDurability: 200,
    durabilityPerLevel: 40,
    craftCost: { iron: 10, mithril: 5, diamonds: 1 },
    getUpgradeCost: (level) => ({
      mithril: 5 * level,
      diamonds: 1 * level,
    }),
    getRepairCost: (missingDurability) => ({
        iron: Math.ceil(missingDurability / 2),
        mithril: Math.ceil(missingDurability / 5),
    }),
  }
};

const craftableItemsList = {
  sword: "Espada de Hierro",
  armor: "Armadura de Hierro",
  gilded_sword: "Espada Dorada",
  mithril_armor: "Armadura de Mithril",
};

// --- Helper Functions ---
function getUser(senderId) {
  const usersDb = readUsersDb();
  return usersDb[senderId];
}

function saveUser(senderId, userData) {
  const usersDb = readUsersDb();
  usersDb[senderId] = userData;
  writeUsersDb(usersDb);
}

function checkResources(inventory, cost) {
  for (const resource in cost) {
    if ((inventory[resource] || 0) < cost[resource]) {
      return false; // Not enough resources
    }
  }
  return true;
}

function subtractResources(inventory, cost) {
  for (const resource in cost) {
    inventory[resource] -= cost[resource];
  }
  return inventory;
}

// --- Command Logic ---
const blacksmithCommand = {
  name: "blacksmith",
  category: "rpg",
  description: "Crea y mejora tu equipamiento. Usa `.blacksmith help` para más info.",
  aliases: ["herrero", "craft", "upgrade", "fabricar", "mejorar", "reparar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const user = getUser(senderId);

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Inicializar datos del usuario para asegurar compatibilidad
    initializeRpgUser(user);

    const action = args[0]?.toLowerCase();
    const itemType = args[1]?.toLowerCase();

    if (!action) {
        return this.showHelp(sock, msg);
    }

    switch (action) {
        case 'craft':
            return this.craftItem(sock, msg, user, itemType);
        case 'upgrade':
            return this.upgradeItem(sock, msg, user, itemType);
        case 'repair':
            return this.repairItem(sock, msg, user, itemType);
        case 'info':
            return this.showInfo(sock, msg, user);
        case 'list':
            return this.showCraftList(sock, msg);
        default:
            return this.showHelp(sock, msg);
    }
  },

  async craftItem(sock, msg, user, itemType) {
    if (!itemType || !itemConfig[itemType]) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Objeto no válido. Usa `.blacksmith list` para ver los objetos que puedes crear." }, { quoted: msg });
    }
    if (user.equipment[itemType]) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Ya tienes una ${itemConfig[itemType].name}. ¡No puedes tener dos!` }, { quoted: msg });
    }

    const isBlacksmith = user.profession === 'blacksmith';
    const config = itemConfig[itemType];
    let cost = { ...config.craftCost };

    if (isBlacksmith) {
        for (const resource in cost) {
            cost[resource] = Math.floor(cost[resource] * 0.8); // 20% discount
        }
    }

    if (!checkResources(user.inventory, cost)) {
        let missing = Object.keys(cost).map(k => `*${cost[k]}* ${k}`).join(', ');
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos. Necesitas: ${missing}.` }, { quoted: msg });
    }

    user.inventory = subtractResources(user.inventory, cost);
    user.equipment[itemType] = {
        level: 1,
        durability: config.baseDurability,
        maxDurability: config.baseDurability,
    };
    // Add specific stats
    if (config.baseAttack) user.equipment[itemType].attack = config.baseAttack;
    if (config.baseDefense) user.equipment[itemType].defense = config.baseDefense;


    saveUser(msg.sender, user);
    await sock.sendMessage(msg.key.remoteJid, { text: `⚔️ ¡Has forjado una ${config.name} (Nivel 1)!` }, { quoted: msg });
  },

  async upgradeItem(sock, msg, user, itemType) {
    if (!itemType || !user.equipment[itemType]) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ese objeto para mejorar. Revisa tu equipamiento con `.blacksmith info`." }, { quoted: msg });
    }

    const config = itemConfig[itemType];
    const item = user.equipment[itemType];
    const isBlacksmith = user.profession === 'blacksmith';
    let cost = config.getUpgradeCost(item.level);

    if (isBlacksmith) {
        for (const resource in cost) {
            cost[resource] = Math.floor(cost[resource] * 0.8); // 20% discount
        }
    }

    if (!checkResources(user.inventory, cost)) {
       let missing = Object.keys(cost).filter(k => cost[k] > 0).map(k => `*${cost[k]}* ${k}`).join(', ');
       return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos para mejorar al Nivel ${item.level + 1}. Necesitas: ${missing}.` }, { quoted: msg });
    }

    user.inventory = subtractResources(user.inventory, cost);

    // --- Upgrade Success Chance ---
    let successChance = Math.max(0.1, 1 - (item.level * 0.08)); // Base success chance
    if (isBlacksmith) {
        successChance += 0.1; // 10% bonus success chance
    }
    const roll = Math.random();

    if (roll <= successChance) {
        // SUCCESS
        item.level += 1;
        item.maxDurability += config.durabilityPerLevel;
        item.durability = item.maxDurability; // Repair on upgrade

        if (item.attack) item.attack += config.attackPerLevel;
        if (item.defense) item.defense += config.defensePerLevel;

        saveUser(msg.sender, user);
        let successMessage = `*¡Mejora Exitosa!* ✨\n\nTu ${config.name} ha sido mejorada al Nivel ${item.level} y reparada completamente.`;
        if (isBlacksmith) successMessage += "\n_Tu habilidad de Herrero te ha ayudado en el proceso._";
        await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
    } else {
        // FAILURE
        saveUser(msg.sender, user);
        let failureMessage = `*¡La mejora ha fallado!* 💥\n\nHas perdido los materiales, pero tu ${config.name} no ha sido destruida.`;
        if (isBlacksmith) failureMessage += "\n_Incluso con tu habilidad, a veces el metal no coopera._";
        await sock.sendMessage(msg.key.remoteJid, { text: failureMessage }, { quoted: msg });
    }
  },

  async repairItem(sock, msg, user, itemType) {
    if (!itemType || !user.equipment[itemType]) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ese objeto para reparar. Revisa tu equipamiento con `.blacksmith info`." }, { quoted: msg });
    }

    const config = itemConfig[itemType];
    const item = user.equipment[itemType];
    const missingDurability = item.maxDurability - item.durability;

    if (missingDurability <= 0) {
        item.durability = item.maxDurability; // Corregir en caso de que la durabilidad sea mayor al máximo
        return sock.sendMessage(msg.key.remoteJid, { text: `Tu ${config.name} ya está completamente reparada.` }, { quoted: msg });
    }

    const isBlacksmith = user.profession === 'blacksmith';
    let cost = config.getRepairCost(missingDurability);

    if (isBlacksmith) {
        for (const resource in cost) {
            cost[resource] = Math.floor(cost[resource] * 0.7); // 30% discount
        }
    }

    if (!checkResources(user.inventory, cost)) {
       let missing = Object.keys(cost).filter(k => cost[k] > 0).map(k => `*${cost[k]}* ${k}`).join(', ');
       return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos para reparar. Necesitas: ${missing}.` }, { quoted: msg });
    }

    user.inventory = subtractResources(user.inventory, cost);
    item.durability = item.maxDurability;

    saveUser(msg.sender, user);
    let repairMessage = `🔧 ¡Tu ${config.name} ha sido reparada por completo!`;
    if (isBlacksmith) repairMessage += "\n_Tus manos expertas han hecho el trabajo más fácil._";
    await sock.sendMessage(msg.key.remoteJid, { text: repairMessage }, { quoted: msg });
  },

  async showInfo(sock, msg, user) {
    if (Object.keys(user.equipment).length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes equipamiento para mostrar. Usa `.blacksmith craft <item>`." }, { quoted: msg });
    }

    let infoMessage = `*🗡️ Tu Equipamiento 🗡️*\n\n`;
    for (const itemType in user.equipment) {
        const item = user.equipment[itemType];
        const config = itemConfig[itemType] || { name: "Objeto Desconocido" };

        infoMessage += `*${config.name} (Nivel ${item.level})*\n`;
        if (item.attack) infoMessage += `> Ataque: +${item.attack}\n`;
        if (item.defense) infoMessage += `> Defensa: +${item.defense}\n`;
        infoMessage += `> Durabilidad: ${item.durability}/${item.maxDurability}\n\n`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: infoMessage.trim() }, { quoted: msg });
  },

  async showCraftList(sock, msg) {
    let list = "*🛠️ Objetos Fabricables 🛠️*\n\n";
    for (const key in craftableItemsList) {
        const itemName = craftableItemsList[key];
        const cost = itemConfig[key].craftCost;
        let reqs = Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(', ');
        list += `*${itemName}* (\`${key}\`)\n_Requiere: ${reqs}_\n\n`;
    }
    return sock.sendMessage(msg.key.remoteJid, { text: list }, { quoted: msg });
  },

  async showHelp(sock, msg) {
    const helpMessage = "*Comandos del Herrero:*\n\n" +
                        "1. `.blacksmith list`\n" +
                        "   - Muestra los objetos que puedes crear.\n\n" +
                        "2. `.blacksmith craft <item>`\n" +
                        "   - Crea un objeto de la lista.\n\n" +
                        "3. `.blacksmith upgrade <item>`\n" +
                        "   - Intenta mejorar un objeto. ¡Puede fallar!\n\n" +
                        "4. `.blacksmith repair <item>`\n" +
                        "   - Repara la durabilidad de un objeto.\n\n" +
                        "5. `.blacksmith info`\n" +
                        "   - Muestra tu equipamiento actual.";
    return sock.sendMessage(msg.key.remoteJid, { text: helpMessage }, { quoted: msg });
  }
};

export default blacksmithCommand;