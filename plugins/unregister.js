import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { readUsageDb, writeUsageDb } from '../lib/usage.js';

const unregisterCommand = {
  name: "unreg",
  category: "general",
  description: "Elimina tu registro del sistema del bot, incluyendo el historial de uso.",
  aliases: ["unregister"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();

    if (!usersDb[senderId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado." }, { quoted: msg });
    }

    // For security, require confirmation with a unique serial number
    const serialNumber = senderId.substring(senderId.length - 8, senderId.length - 4);
    const confirmation = args[0];

    if (confirmation !== serialNumber) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ *Confirmación Requerida* ⚠️\n\n" +
                  "Para eliminar tu registro, debes confirmar con tu número de serie único.\n" +
                  `Usa el comando: \`.unreg ${serialNumber}\``
        }, { quoted: msg });
    }

    // 1. Delete from main user DB
    delete usersDb[senderId];
    writeUsersDb(usersDb);

    // 2. Delete from command usage DB to close the loophole
    const usageDb = readUsageDb();
    if (usageDb[senderId]) {
        delete usageDb[senderId];
        writeUsageDb(usageDb);
    }

    await sock.sendMessage(msg.key.remoteJid, { text: "✅ Has eliminado tu registro exitosamente. Todos tus datos, incluyendo el historial de uso de comandos, han sido borrados." }, { quoted: msg });
  }
};

export default unregisterCommand;