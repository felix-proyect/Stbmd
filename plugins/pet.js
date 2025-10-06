import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser } from '../lib/utils.js';

const petOptions = [
    { name: "Lobo Fiel", emoji: "🐺", type: "strength", bonus: 2, description: "Un compañero leal que aumenta tu fuerza en +2." },
    { name: "Halcón Vigía", emoji: "🦅", type: "speed", bonus: 2, description: "Un ojo en el cielo que aumenta tu velocidad en +2." },
    { name: "Tortuga Guardiana", emoji: "🐢", type: "defense", bonus: 2, description: "Un caparazón resistente que aumenta tu defensa en +2." },
    { name: "Zorro Astuto", emoji: "🦊", type: "coins", bonus: 0.05, description: "Un buscador de tesoros que aumenta tus ganancias de monedas en un 5%." }
];

const petCommand = {
  name: "pet",
  category: "rpg",
  description: "Consigue y gestiona tu mascota de compañía.",
  aliases: ["mascota"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const action = args[0]?.toLowerCase();

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }
    initializeRpgUser(user);

    if (!action) {
        if (user.pet) {
            return sock.sendMessage(msg.key.remoteJid, { text: `*🐾 Tu Mascota 🐾*\n\n*Nombre:* ${user.pet.name} ${user.pet.emoji}\n*Habilidad:* ${user.pet.description}` }, { quoted: msg });
        } else {
            return sock.sendMessage(msg.key.remoteJid, { text: "Aún no tienes una mascota. Usa `.pet adopt` para conseguir una compañera de aventuras." }, { quoted: msg });
        }
    }

    if (action === 'adopt') {
        if (user.pet) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes una mascota. ¡Cuídala bien!" }, { quoted: msg });
        }

        const cost = 2500;
        if (user.coins < cost) {
            return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas para adoptar una mascota. Necesitas ${cost} WFCoins.` }, { quoted: msg });
        }

        user.coins -= cost;
        const newPet = petOptions[Math.floor(Math.random() * petOptions.length)];
        user.pet = newPet;

        // Aplicar el bonus inicial
        if (newPet.type !== 'coins') {
            user[newPet.type] = (user[newPet.type] || 0) + newPet.bonus;
        }

        writeUsersDb(usersDb);

        const successMessage = `*🎉 ¡Has Adoptado una Mascota! 🎉*\n\n` +
                               `Le has dado un hogar a un *${newPet.name} ${newPet.emoji}*.\n` +
                               `*Habilidad:* ${newPet.description}`;
        return sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
    }

    return sock.sendMessage(msg.key.remoteJid, { text: `Comando no válido. Usa \`.pet\` o \`.pet adopt\`.` }, { quoted: msg });
  }
};

export default petCommand;