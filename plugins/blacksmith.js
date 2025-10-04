import { readUsersDb, writeUsersDb } from '../lib/database.js';

// --- Sword Configuration ---
const swordConfig = {
  baseAttack: 5,
  attackPerLevel: 3,
  craftCost: {
    stone: 20,
    coal: 10,
    iron: 10,
  },
  getUpgradeCost: (level) => {
    return {
      stone: 20 * level,
      coal: 10 * level,
      iron: 10 * level,
      diamonds: Math.max(0, level - 2), // Diamonds needed from level 3 onwards
    };
  },
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
  aliases: ["herrero", "craft", "upgrade"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const user = getUser(senderId);

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Initialize equipment if it doesn't exist
    if (!user.equipment) {
      user.equipment = {};
    }

    const action = args[0]?.toLowerCase();
    const item = args[1]?.toLowerCase();

    switch (action) {
      case 'craft':
        if (item === 'sword') {
          return this.craftSword(sock, msg, user);
        }
        // Add other craftable items here in the future
        return sock.sendMessage(msg.key.remoteJid, { text: "No se puede crear ese objeto. Por ahora, solo puedes crear una 'sword'." }, { quoted: msg });

      case 'upgrade':
        if (item === 'sword') {
          return this.upgradeSword(sock, msg, user);
        }
        // Add other upgradable items here
        return sock.sendMessage(msg.key.remoteJid, { text: "No se puede mejorar ese objeto." }, { quoted: msg });

      case 'info':
        return this.showInfo(sock, msg, user);

      default:
        const helpMessage = "*Comandos del Herrero:*\n\n" +
                            "1. `.blacksmith craft sword`\n" +
                            "   - Crea una espada básica.\n" +
                            "2. `.blacksmith upgrade sword`\n" +
                            "   - Mejora tu espada al siguiente nivel.\n" +
                            "3. `.blacksmith info`\n" +
                            "   - Muestra información sobre tu equipamiento.";
        return sock.sendMessage(msg.key.remoteJid, { text: helpMessage }, { quoted: msg });
    }
  },

  async craftSword(sock, msg, user) {
    if (user.equipment.sword) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes una espada. ¡No puedes tener dos!" }, { quoted: msg });
    }

    const cost = swordConfig.craftCost;
    if (!checkResources(user.inventory, cost)) {
      let missing = Object.keys(cost).map(k => `*${cost[k]}* ${k}`).join(', ');
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos. Necesitas: ${missing}.` }, { quoted: msg });
    }

    user.inventory = subtractResources(user.inventory, cost);
    user.equipment.sword = {
      level: 1,
      attack: swordConfig.baseAttack,
    };

    saveUser(msg.sender, user);
    await sock.sendMessage(msg.key.remoteJid, { text: `⚔️ ¡Has forjado una Espada de Hierro (Nivel 1)!\n*Ataque:* +${user.equipment.sword.attack}` }, { quoted: msg });
  },

  async upgradeSword(sock, msg, user) {
    if (!user.equipment.sword) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes una espada para mejorar. Primero crea una con `.blacksmith craft sword`." }, { quoted: msg });
    }

    const currentLevel = user.equipment.sword.level;
    const cost = swordConfig.getUpgradeCost(currentLevel);

    if (!checkResources(user.inventory, cost)) {
       let missing = Object.keys(cost).filter(k => cost[k] > 0).map(k => `*${cost[k]}* ${k}`).join(', ');
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos para mejorar al Nivel ${currentLevel + 1}. Necesitas: ${missing}.` }, { quoted: msg });
    }

    user.inventory = subtractResources(user.inventory, cost);
    user.equipment.sword.level += 1;
    user.equipment.sword.attack += swordConfig.attackPerLevel;

    saveUser(msg.sender, user);
    await sock.sendMessage(msg.key.remoteJid, { text: `✨ ¡Tu espada ha sido mejorada al Nivel ${user.equipment.sword.level}!\n*Nuevo Ataque:* +${user.equipment.sword.attack}` }, { quoted: msg });
  },

  async showInfo(sock, msg, user) {
    if (!user.equipment.sword) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes equipamiento para mostrar." }, { quoted: msg });
    }

    const sword = user.equipment.sword;
    const infoMessage = `*🗡️ Tu Equipamiento 🗡️*\n\n` +
                        `*Espada (Nivel ${sword.level})*\n` +
                        `> Ataque: +${sword.attack}`;

    await sock.sendMessage(msg.key.remoteJid, { text: infoMessage }, { quoted: msg });
  }
};

export default blacksmithCommand;