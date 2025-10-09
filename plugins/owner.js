const ownerCommand = {
  name: "owner",
  category: "general",
  description: "Muestra la información de contacto del creador y los enlaces oficiales.",

  async execute({ sock, msg, config }) {
    // Array of 10 decorations
    const decorations = [
      "✨✨✨✨✨✨✨✨✨✨",
      "🌟-🌟-🌟-🌟-🌟-🌟-🌟-🌟",
      "💖•💖•💖•💖•💖•💖•💖",
      "═════[ 👑 ]═════",
      "✧⋄⋆⋅⋆⋄✧⋄⋆⋅⋆⋄✧⋄⋆⋅⋆⋄✧",
      "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀",
      "🎉-🎉-🎉-🎉-🎉-🎉-🎉-🎉",
      "═════[ 🔥 ]═════",
      "✅-✅-✅-✅-✅-✅-✅-✅",
      "🤖•🤖•🤖•🤖•🤖•🤖•🤖"
    ];

    // Select a random decoration
    const randomDecoration = decorations[Math.floor(Math.random() * decorations.length)];

    // Get owner number from config
    const ownerNumber = config.ownerNumbers[0];
    const ownerContactLink = `https://wa.me/${ownerNumber}?text=Hola,%20vengo%20de%20parte%20de%20tu%20bot`;

    // Official links
    const groupLink = "https://chat.whatsapp.com/IsT9vsbFDnZ8VvFxGrZA2I";
    const communityLink = "https://chat.whatsapp.com/H3BInAIb8AM9qpWDJlyJ8e";
    const channelLink = "https://whatsapp.com/channel/0029VbAmMiM96H4KgBHZUn1z";

    // Construct the message
    const ownerText = `
${randomDecoration}

*👑 CREADOR/OWNER 👑*

*Nombre:* ${config.ownerName}
*Contacto:* ${ownerContactLink}

*🔗 ENLACES OFICIALES 🔗*

*Grupo:* ${groupLink}
*Comunidad:* ${communityLink}
*Canal:* ${channelLink}

${randomDecoration}
    `.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: ownerText }, { quoted: msg });
  }
};

export default ownerCommand;