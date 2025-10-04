import { readSettingsDb, writeSettingsDb } from '../lib/database.js';

const rpgToggleCommand = {
  name: "rpg",
  category: "grupos",
  description: "Activa o desactiva todos los comandos de RPG en este grupo.",
  aliases: ["rpgmode"],
  group: true,
  admin: true,

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (option !== 'on' && option !== 'off') {
      return sock.sendMessage(from, { text: "Por favor, especifica una opción: `on` o `off`.\n\nEjemplo: `.rpg on`" }, { quoted: msg });
    }

    const settings = readSettingsDb();
    if (!settings[from]) {
      settings[from] = {};
    }

    const isEnabling = option === 'on';
    settings[from].rpgEnabled = isEnabling;
    writeSettingsDb(settings);

    const message = isEnabling
      ? "✅ El sistema de RPG ha sido **activado** en este grupo."
      : "❌ El sistema de RPG ha sido **desactivado** en este grupo. Los comandos no funcionarán ni aparecerán en el menú.";

    await sock.sendMessage(from, { text: message }, { quoted: msg });
  }
};

export default rpgToggleCommand;