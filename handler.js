// Este es el manejador de mensajes que usarán los sub-bots y el bot principal.
import { commands, aliases, testCache, cooldowns } from './index.js';
import config from './config.js';
import { readSettingsDb, readMaintenanceDb } from './lib/database.js';
import print from './lib/print.js';
import { normalizeJid } from './lib/utils.js';

const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

export async function handler(m, isSubBot = false) {
  const sock = this;

  try {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    try { await print(msg, sock); } catch (e) { console.error("Print error:", e); }

    const senderId = msg.key.participant || msg.key.remoteJid;
    msg.sender = senderId;

    const from = msg.key.remoteJid;
    let body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // --- Ejecutar Auto-Handlers ---
    // Busca comandos que no necesitan prefijo y se ejecutan automáticamente.
    const autoHandlers = Array.from(commands.values()).filter(cmd => cmd.isAutoHandler);
    for (const handler of autoHandlers) {
      try {
        // Pasamos el cuerpo del mensaje para evitar que cada handler lo recalcule.
        await handler.execute({ sock, msg, body });
      } catch (error) {
        console.error(`Error en el auto-handler ${handler.name}:`, error);
      }
    }
    // --- Fin de Auto-Handlers ---

    const settings = readSettingsDb();
    const groupPrefix = from.endsWith('@g.us') ? settings[from]?.prefix : null;

    let commandName;
    let args;

    if (groupPrefix) {
      if (!body.startsWith(groupPrefix)) return;
      body = body.slice(groupPrefix.length);
      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    } else {
      // Si hay prefijo global o si no hay prefijo de grupo, procesar normal
      const globalPrefix = config.prefix; // Asumiendo que podría haber un prefijo global en config
      if (globalPrefix && !body.startsWith(globalPrefix)) return;
      if (globalPrefix) body = body.slice(globalPrefix.length);

      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    }

    let command = commands.get(commandName) || commands.get(aliases.get(commandName));

    if (command) {
      // --- Verificaciones de Permisos ---
      const isGroup = from.endsWith('@g.us');
      const senderNumber = senderId.split('@')[0];
      const isOwner = config.ownerNumbers.includes(senderNumber);

      if (command.category === 'propietario' && !isOwner) {
        return sock.sendMessage(from, { text: "Este comando es solo para el propietario del bot." });
      }

      if (command.group && !isGroup) {
        return sock.sendMessage(from, { text: "Este comando solo puede usarse en grupos." });
      }

      if (isGroup && (command.admin || command.botAdmin)) {
        const groupMetadata = await sock.groupMetadata(from);
        const botJid = normalizeJid(sock.user.id);
        const normalizedSenderId = normalizeJid(senderId);

        const botIsAdmin = groupMetadata.participants.some(p => normalizeJid(p.id) === botJid && (p.admin === 'admin' || p.admin === 'superadmin'));
        const senderIsAdmin = groupMetadata.participants.some(p => normalizeJid(p.id) === normalizedSenderId && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (command.botAdmin && !botIsAdmin) {
          return sock.sendMessage(from, { text: "Necesito ser administrador del grupo para usar este comando." });
        }

        if (command.admin && !senderIsAdmin) {
          return sock.sendMessage(from, { text: "Necesitas ser administrador del grupo para usar este comando." });
        }
      }

      if (command.category === 'subbots' && !isOwner) {
        // En un futuro, aquí se podría comprobar una lista de usuarios autorizados
        return sock.sendMessage(from, { text: "No tienes permiso para gestionar sub-bots." });
      }
      // Los sub-bots no pueden usar comandos de propietario/sub-bots
      if (isSubBot && (command.category === 'propietario' || command.category === 'subbots')) {
        return sock.sendMessage(from, { text: "Un sub-bot no puede usar este comando." });
      }

      // Cooldown
      if (cooldowns.has(senderId)) {
        const timeDiff = (Date.now() - cooldowns.get(senderId)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      // Verificación de Mantenimiento
      const maintenanceList = readMaintenanceDb();
      if (maintenanceList.includes(commandName) && !isOwner) {
        return sock.sendMessage(from, { text: "🛠️ Este comando está actualmente en mantenimiento. Por favor, inténtalo más tarde." });
      }

      // Ejecución
      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        // Pasamos 'commandName' para que los comandos puedan saber con qué alias fueron llamados.
        await command.execute({ sock, msg, args, commands, config, testCache, isOwner, commandName });
        cooldowns.set(senderId, Date.now());
      } catch (error) {
        console.error(`Error en comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al ejecutar ese comando.' });
      }
    }
  } catch (e) {
    console.error("Error en el manejador de mensajes:", e);
  }
}
