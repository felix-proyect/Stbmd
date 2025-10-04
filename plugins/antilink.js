import { readSettingsDb, writeSettingsDb } from '../lib/database.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

// Regex for different link types
const linkRegexWaGroups = /chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}/i;
const linkRegexWaChannels = /whatsapp\.com\/channel\/[0-9A-Za-z]{20,24}/i;
const linkRegexAll = /https?:\/\/\S+/i;

const antilinkPlugin = {
  name: "antilink",
  category: "grupos",
  description: "Activa o desactiva la eliminación de enlaces. Niveles: 1 (solo WhatsApp), 2 (todos los enlaces).",
  aliases: ["antilinks"],
  isAutoHandler: true, // Mark as an auto-handler to run on every message

  /**
   * This function handles both the command and the auto-detection logic.
   * It differentiates based on the arguments passed by handler.js.
   * - `body` is passed for auto-handlers.
   * - `args` is passed for commands.
   */
  async execute({ sock, msg, args, body }) {
    // If 'args' is defined, it's a command call. Otherwise, it's an auto-handler call.
    if (args) {
      return this.command({ sock, msg, args });
    } else {
      return this.handler({ sock, msg, body });
    }
  },

  /**
   * The command logic to configure antilink settings for a group.
   */
  async command({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const senderParticipant = metadata.participants.find(p => areJidsSameUser(p.id, msg.sender));
      const senderIsAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

      if (!senderIsAdmin) {
        return sock.sendMessage(from, { text: "No tienes permisos de administrador para usar este comando." }, { quoted: msg });
      }
    } catch (e) {
      return sock.sendMessage(from, { text: "Ocurrió un error al verificar tus permisos." }, { quoted: msg });
    }

    if (!['1', '2', 'on', 'off'].includes(option)) {
      return sock.sendMessage(from, { text: "Usa `.antilink <nivel>`.\n\n*Niveles:*\n- `1`: Bloquear enlaces de WhatsApp.\n- `2`: Bloquear todos los enlaces.\n- `off`: Desactivar." }, { quoted: msg });
    }

    const settings = readSettingsDb();
    if (!settings[from]) {
      settings[from] = {};
    }

    let message;
    if (option === '1' || option === 'on') { // 'on' for backwards compatibility
      settings[from].antilink = 1;
      message = "✅ Anti-Link (Nivel 1: WhatsApp) ha sido activado.";
    } else if (option === '2') {
      settings[from].antilink = 2;
      message = "✅ Anti-Link (Nivel 2: Todos los enlaces) ha sido activado.";
    } else { // 'off'
      settings[from].antilink = 0; // Use 0 for off
      message = "❌ El Anti-Link ha sido desactivado.";
    }

    writeSettingsDb(settings);
    await sock.sendMessage(from, { text: message }, { quoted: msg });
  },

  /**
   * The auto-handler logic that detects and acts on forbidden links.
   */
  async handler({ sock, msg, body }) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us') || !body) return;

    const settings = readSettingsDb();
    const antilinkLevel = settings[from]?.antilink;

    if (!antilinkLevel) return; // Antilink is disabled for this group (level 0 or undefined)

    const metadata = await sock.groupMetadata(from);
    const senderParticipant = metadata.participants.find(p => areJidsSameUser(p.id, msg.sender));
    const senderIsAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
    if (senderIsAdmin) return;

    let isForbiddenLink = false;
    if (antilinkLevel === 1) {
      isForbiddenLink = linkRegexWaGroups.test(body) || linkRegexWaChannels.test(body);
    } else if (antilinkLevel === 2) {
      isForbiddenLink = linkRegexAll.test(body);
    }

    if (!isForbiddenLink) return;

    try {
      const groupInviteCode = await sock.groupInviteCode(from);
      if (body.includes(groupInviteCode)) {
        return; // It's a link to this group, so allow it.
      }
    } catch (e) {
      console.warn("Antilink: Could not get group invite code. This is expected if bot is not admin.");
    }

    const userTag = `@${msg.sender.split('@')[0]}`;

    try {
      await sock.sendMessage(from, { text: `*「 ANTILINK DETECTADO 」*\n\n${userTag}, rompiste las reglas del grupo y serás eliminado.`, mentions: [msg.sender]}, { quoted: msg });

      // Delete the message first
      await sock.sendMessage(from, { delete: msg.key });

      // Then kick the user
      await sock.groupParticipantsUpdate(from, [msg.sender], 'remove');
    } catch (e) {
      console.error("Antilink Error:", e);
      await sock.sendMessage(from, { text: `*「 ANTILINK DETECTADO 」*\n\n${userTag}, enviaste un link prohibido. No pude eliminarte porque me faltan permisos.`, mentions: [msg.sender]}, { quoted: msg });
    }
  }
};

export default antilinkPlugin;