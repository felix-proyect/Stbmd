import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const professions = {
  blacksmith: {
    name: "Herrero",
    description: "Un maestro de la forja. Los herreros tienen menores costos de fabricación y mayores probabilidades de éxito al mejorar equipos.",
    emoji: "🛠️"
  },
  miner: {
    name: "Minero",
    description: "Experto en la extracción de recursos. Los mineros tienen una mayor probabilidad de encontrar minerales raros y en mayor cantidad.",
    emoji: "⛏️"
  },
  alchemist: {
    name: "Alquimista",
    description: "Un conocedor de pociones y transmutaciones. (Profesión no implementada aún).",
    emoji: "⚗️"
  }
};

const professionsCommand = {
  name: "profession",
  category: "rpg",
  description: "Elige o ve información sobre una profesión.",
  aliases: ["profesion", "professions"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    // Inicializar datos del usuario para asegurar compatibilidad
    initializeRpgUser(user);

    const action = args[0]?.toLowerCase();

    if (!action || action === 'info') {
        if (user.profession) {
            const prof = professions[user.profession];
            return sock.sendMessage(msg.key.remoteJid, { text: `Tu profesión actual es *${prof.emoji} ${prof.name}*.\n\n_${prof.description}_` }, { quoted: msg });
        } else {
            return this.showProfessionList(sock, msg);
        }
    }

    if (action === 'list') {
        return this.showProfessionList(sock, msg);
    }

    if (action === 'choose' || action === 'elegir') {
        const professionChoice = args[1]?.toLowerCase();
        if (user.profession) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya has elegido una profesión. ¡La decisión es permanente!" }, { quoted: msg });
        }
        if (!professionChoice || !professions[professionChoice]) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Profesión no válida. Usa `.profession list` para ver las opciones." }, { quoted: msg });
        }
        if (professionChoice === 'alchemist') {
            return sock.sendMessage(msg.key.remoteJid, { text: "La profesión de Alquimista aún no está disponible." }, { quoted: msg });
        }

        user.profession = professionChoice;
        writeUsersDb(usersDb);
        const prof = professions[professionChoice];
        return sock.sendMessage(msg.key.remoteJid, { text: `¡Te has convertido en un *${prof.emoji} ${prof.name}*!\n\nTu elección ha quedado registrada.` }, { quoted: msg });
    }

    return this.showHelp(sock, msg);
  },

  async showProfessionList(sock, msg) {
    let list = "*📜 Profesiones Disponibles 📜*\n\n";
    for (const key in professions) {
        const prof = professions[key];
        list += `*${prof.emoji} ${prof.name}* (\`${key}\`)\n_${prof.description}_\n\n`;
    }
    list += "Para elegir una, usa `.profession choose <nombre>`. ¡La elección es permanente!";
    return sock.sendMessage(msg.key.remoteJid, { text: list }, { quoted: msg });
  },

  async showHelp(sock, msg) {
      const help = "*Comandos de Profesión:*\n\n" +
                   "1. `.profession list`\n   - Muestra las profesiones disponibles.\n\n" +
                   "2. `.profession choose <nombre>`\n   - Elige tu profesión (solo una vez).\n\n" +
                   "3. `.profession info`\n   - Muestra tu profesión actual.";
      return sock.sendMessage(msg.key.remoteJid, { text: help }, { quoted: msg });
  }
};

export default professionsCommand;