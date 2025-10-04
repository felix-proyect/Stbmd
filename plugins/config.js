import { readSettingsDb } from '../lib/database.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

const configCommand = {
  name: "config",
  category: "grupos",
  description: "Muestra la configuración actual del bot para este grupo.",
  aliases: ["settings", "ajustes"],
  group: true,
  admin: true,

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid;
    const settings = readSettingsDb();
    const groupSettings = settings[from] || {};

    // Función para obtener el estado como emoji y texto
    const getStatus = (value) => {
      return value ? "✅ Activado" : "❌ Desactivado";
    };

    const adminModeStatus = getStatus(groupSettings.adminMode);
    const welcomeStatus = getStatus(groupSettings.welcome);
    const byeStatus = getStatus(groupSettings.bye);
    const prefix = groupSettings.prefix ? `\`${groupSettings.prefix}\`` : "No establecido (usa el global)";

    let configMessage = `*⚙️ Configuración del Bot para este Grupo ⚙️*\n\n`;
    configMessage += `1. *Modo Admin:* ${adminModeStatus}\n`;
    configMessage += `   - _Si está activado, solo los admins pueden usar el bot._\n\n`;
    configMessage += `2. *Bienvenidas:* ${welcomeStatus}\n`;
    configMessage += `   - _Mensaje de bienvenida para nuevos miembros._\n\n`;
    configMessage += `3. *Despedidas:* ${byeStatus}\n`;
    configMessage += `   - _Mensaje de despedida cuando alguien se va._\n\n`;
    configMessage += `4. *Prefijo del Grupo:* ${prefix}\n`;
    configMessage += `   - _Prefijo personalizado para los comandos en este grupo._\n`;

    await sock.sendMessage(from, { text: configMessage.trim() }, { quoted: msg });
  }
};

export default configCommand;