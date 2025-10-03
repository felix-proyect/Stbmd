const linkCommand = {
  name: "link",
  category: "grupos",
  description: "Obtiene el enlace de invitación del grupo.",
  group: true, // Standard property to ensure it's only used in groups

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid;

    try {
      // Attempt to get and send the link directly.
      // If the bot is not an admin, this will throw an error which is caught below.
      const inviteCode = await sock.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      await sock.sendMessage(from, { text: `Aquí tienes el enlace de invitación del grupo:\n\n${inviteLink}` }, { quoted: msg });

    } catch (error) {
      console.error("Error in link command:", error);
      await sock.sendMessage(from, { text: "❌ Ocurrió un error. No pude obtener el enlace, probablemente porque no soy administrador." }, { quoted: msg });
    }
  }
};

export default linkCommand;