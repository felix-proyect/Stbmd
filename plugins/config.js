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
    const getStatus = (value) => (value ? "✅ Activado" : "❌ Desactivado");

    const adminModeStatus = getStatus(groupSettings.adminMode);
    const welcomeStatus = getStatus(groupSettings.welcome);
    const byeStatus = getStatus(groupSettings.bye);
    const prefix = groupSettings.prefix ? `\`${groupSettings.prefix}\`` : "🌐 Prefijo global";

    // Bordes y decoración
    const borderTop = "╭─❖✦❖─╮";
    const borderBottom = "╰─❖✦❖─╯";
    const decoLine = "✨━━━━━━━━━━━━✨";

    let configMessage = `${borderTop}\n⚙️ *Configuración del Bot para este Grupo* ⚙️\n${borderTop}\n\n`;
    configMessage += `1️⃣ *Modo Admin:* ${adminModeStatus}\n   _Si está activado, solo los admins pueden usar el bot._\n\n`;
    configMessage += `2️⃣ *Bienvenidas:* ${welcomeStatus}\n   _Mensaje de bienvenida para nuevos miembros._\n\n`;
    configMessage += `3️⃣ *Despedidas:* ${byeStatus}\n   _Mensaje de despedida cuando alguien se va._\n\n`;
    configMessage += `4️⃣ *Prefijo del Grupo:* ${prefix}\n   _Prefijo personalizado para los comandos en este grupo._\n\n`;
    configMessage += `${decoLine}\n🌸 ¡Disfruta tu bot decorado! 🌸\n${borderBottom}`;

    await sock.sendMessage(from, { text: configMessage.trim() }, { quoted: msg });
  }
};

export default configCommand;
