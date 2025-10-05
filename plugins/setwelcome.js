import { readSettingsDb, writeSettingsDb } from '../lib/database.js';

const setWelcomeCommand = {
  name: "setwelcome",
  category: "grupos",
  description: "Establece un mensaje de bienvenida dinámico.\n\n" +
               "Variables disponibles:\n" +
               "  `@user`: Menciona al usuario.\n" +
               "  `@subject`: Nombre del grupo.\n" +
               "  `@desc`: Descripción del grupo.\n" +
               "  `@count`: Número de miembros.\n" +
               "  `@tag`: Menciona a todos.\n\n" +
               "Para múltiples mensajes, sepáralos con `|` (máx. 3).",

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
    }

    // Verificar si el usuario es administrador del grupo
    try {
      const metadata = await sock.groupMetadata(from);
      const senderId = msg.key.participant || msg.key.remoteJid;
      const participant = metadata.participants.find(p => p.id === senderId);
      if (!participant || !['admin', 'superadmin'].includes(participant.admin)) {
        return sock.sendMessage(from, { text: "No tienes permisos de administrador para usar este comando." }, { quoted: msg });
      }
    } catch (e) {
      return sock.sendMessage(from, { text: "Ocurrió un error al verificar tus permisos." }, { quoted: msg });
    }

    const settings = readSettingsDb();
    const welcomeText = args.join(' ');

    if (!settings[from]) {
      settings[from] = {};
    }

    if (welcomeText.toLowerCase() === 'off' || welcomeText.toLowerCase() === 'disable') {
      settings[from].welcome = false;
      writeSettingsDb(settings);
      return sock.sendMessage(from, { text: "✅ Los mensajes de bienvenida han sido desactivados para este grupo." }, { quoted: msg });
    }

    if (!welcomeText) {
        return sock.sendMessage(from, { text: "Por favor, proporciona un mensaje de bienvenida. Revisa el comando `menu` para ver todas las variables disponibles.\n\n*Ejemplo:*\n`.setwelcome ¡Hola @user! Bienvenido a @subject. Somos @count miembros.`" }, { quoted: msg });
    }

    settings[from].welcome = true;
    settings[from].welcomeMessage = welcomeText;
    writeSettingsDb(settings);

    await sock.sendMessage(from, { text: `✅ Mensaje de bienvenida establecido:\n\n"${welcomeText}"` }, { quoted: msg });
  }
};

export default setWelcomeCommand;
