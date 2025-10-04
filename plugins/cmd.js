import { exec } from 'child_process';
import util from 'util';
import config from '../config.js';

const execPromise = util.promisify(exec);

const execHandler = {
  // Propiedad clave para que se ejecute en cada mensaje
  isAutoHandler: true,
  name: 'exec-auto-handler', // Nombre interno para logs

  async execute({ sock, msg, body }) {
    // 1. Verificar si el usuario es el propietario del bot
    const senderNumber = msg.sender.split('@')[0];
    const isOwner = config.ownerNumbers.includes(senderNumber);

    if (!isOwner) {
      return; // No es el propietario, no hacer nada.
    }

    // 2. Verificar si el mensaje comienza con el símbolo de activación '$'
    if (!body || !body.startsWith('$')) {
      return; // No es un comando para este manejador.
    }

    // 3. Extraer el comando a ejecutar (el texto después de '$')
    const commandToExecute = body.slice(1).trim();
    if (!commandToExecute) {
      // Si el usuario solo envía '$', no hacer nada.
      return;
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚙️", key: msg.key } });

    try {
      const { stdout, stderr } = await execPromise(commandToExecute);
      let output = "";

      if (stdout) {
        output += `*Salida (stdout):*\n\`\`\`${stdout.trim()}\`\`\`\n\n`;
      }
      if (stderr) {
        output += `*Errores (stderr):*\n\`\`\`${stderr.trim()}\`\`\`\n\n`;
      }

      if (output.trim() === "") {
        output = "✅ Comando ejecutado sin salida.";
      }

      await sock.sendMessage(msg.key.remoteJid, { text: output.trim() }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
      console.error("Error en el exec-handler:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });

      const errorMessage = `*Error de Ejecución:*\n\`\`\`${error.message}\`\`\``;
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default execHandler;