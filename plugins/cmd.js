import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const cmdCommand = {
  name: "cmd",
  category: "propietario",
  description: "Ejecuta un comando en la terminal del servidor.",
  aliases: ["$"],
  owner: true, // Doble seguridad, aunque la categoría ya lo restringe.

  async execute({ sock, msg, text }) {
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un comando para ejecutar." }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚙️", key: msg.key } });

    try {
      const { stdout, stderr } = await execPromise(text);
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
      console.error("Error en el comando 'cmd':", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });

      const errorMessage = `*Error de Ejecución:*\n\`\`\`${error.message}\`\`\``;
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default cmdCommand;