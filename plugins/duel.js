import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { initializeRpgUser, getUserFromMessage } from '../lib/utils.js';
import fs from 'fs';

const DUELS_FILE_PATH = './database/rpg_duels.json';

const readDuelsDb = () => {
    try {
        if (!fs.existsSync(DUELS_FILE_PATH)) return [];
        return JSON.parse(fs.readFileSync(DUELS_FILE_PATH, 'utf8'));
    } catch (error) {
        return [];
    }
};

const writeDuelsDb = (data) => {
    fs.writeFileSync(DUELS_FILE_PATH, JSON.stringify(data, null, 2));
};

const duelCommand = {
  name: "duel",
  category: "rpg",
  description: "Reta a otro jugador a un duelo a muerte. Uso: .duel @usuario [apuesta]",
  aliases: ["pvp"],
  group: true,

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const action = args[0]?.toLowerCase();

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG." }, { quoted: msg });
    }
    initializeRpgUser(user);

    let duels = readDuelsDb();
    // Limpiar duelos expirados (más de 5 minutos)
    duels = duels.filter(d => (Date.now() - d.createdAt) < (5 * 60 * 1000));

    if (action === 'accept') {
        return this.acceptDuel(sock, msg, user, usersDb, duels);
    }
    if (action === 'reject') {
        return this.rejectDuel(sock, msg, user, duels);
    }

    return this.proposeDuel(sock, msg, args, user, usersDb, duels);
  },

  async proposeDuel(sock, msg, args, user, usersDb, duels) {
    const targetId = getUserFromMessage(msg, args);
    if (!targetId || !usersDb[targetId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario válido para retar." }, { quoted: msg });
    }
    if (targetId === msg.sender) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No puedes retarte a ti mismo." }, { quoted: msg });
    }

    const existingDuel = duels.find(d => (d.from === msg.sender && d.to === targetId) || (d.from === targetId && d.to === msg.sender));
    if (existingDuel) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ya hay un duelo pendiente entre ustedes dos." }, { quoted: msg });
    }

    const newDuel = {
        from: msg.sender,
        to: targetId,
        createdAt: Date.now()
    };
    duels.push(newDuel);
    writeDuelsDb(duels);

    const proposalMessage = `*⚔️ ¡Duelo Propuesto! ⚔️*\n\n` +
                            `@${msg.sender.split('@')[0]} ha retado a @${targetId.split('@')[0]} a un duelo.\n\n` +
                            `@${targetId.split('@')[0]}, para aceptar, usa el comando: \`.duel accept\`\n` +
                            `Para rechazar, usa: \`.duel reject\`\n\n` +
                            `_La propuesta expira en 5 minutos._`;

    await sock.sendMessage(msg.key.remoteJid, { text: proposalMessage, mentions: [msg.sender, targetId] });
  },

  async acceptDuel(sock, msg, user, usersDb, duels) {
    const duelIndex = duels.findIndex(d => d.to === msg.sender);
    if (duelIndex === -1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ninguna propuesta de duelo pendiente para aceptar." }, { quoted: msg });
    }

    const duel = duels[duelIndex];
    const challenger = usersDb[duel.from];
    const opponent = user; // El que acepta

    initializeRpgUser(challenger);

    // --- Lógica de Combate ---
    let combatLog = `*💥 ¡Comienza el Duelo entre @${duel.from.split('@')[0]} y @${duel.to.split('@')[0]}! 💥*\n\n`;

    let attacker = challenger;
    let defender = opponent;
    let turn = 1;

    while (challenger.hp > 0 && opponent.hp > 0) {
        const attackPower = Math.floor(Math.random() * attacker.strength) + 1;
        const defensePower = Math.floor(Math.random() * defender.defense / 2) + 1;
        const damage = Math.max(1, attackPower - defensePower);

        defender.hp -= damage;

        combatLog += `*Turno ${turn}:*\n` +
                   `> @${attacker.id.split('@')[0]} ataca y causa *${damage}* de daño.\n` +
                   `> @${defender.id.split('@')[0]} queda con *${defender.hp > 0 ? defender.hp : 0}* HP.\n\n`;

        // Cambiar turnos
        [attacker, defender] = [defender, attacker];
        turn++;
        if (turn > 10) { // Límite de turnos para evitar bucles infinitos
            combatLog += "El combate fue muy largo y ambos se agotaron. ¡Es un empate!";
            break;
        }
    }

    let winner, loser;
    if (challenger.hp > opponent.hp) {
        winner = challenger;
        loser = opponent;
    } else if (opponent.hp > challenger.hp) {
        winner = opponent;
        loser = loser;
    }

    if (winner) {
        const reward = Math.floor(loser.coins * 0.1); // El ganador roba el 10% de las monedas del perdedor
        winner.coins += reward;
        loser.coins -= reward;
        combatLog += `*🏆 ¡Victoria para @${winner.id.split('@')[0]}! 🏆*\n` +
                     `Ha ganado *${reward}* WFCoins del perdedor.`;
    }

    // Restaurar HP (o dejarlo bajo, a decidir)
    challenger.hp = challenger.maxHp;
    opponent.hp = opponent.maxHp;

    // Guardar y limpiar
    duels.splice(duelIndex, 1);
    writeDuelsDb(duels);
    writeUsersDb(usersDb);

    await sock.sendMessage(msg.key.remoteJid, { text: combatLog, mentions: [duel.from, duel.to] });
  },

  async rejectDuel(sock, msg, user, duels) {
    const duelIndex = duels.findIndex(d => d.to === msg.sender || d.from === msg.sender);
    if (duelIndex === -1) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ninguna propuesta de duelo para rechazar." }, { quoted: msg });
    }
    const duel = duels[duelIndex];
    duels.splice(duelIndex, 1);
    writeDuelsDb(duels);

    const rejectionMessage = `*❌ Duelo Rechazado ❌*\n\n` +
                             `@${msg.sender.split('@')[0]} ha rechazado el duelo contra @${(duel.from === msg.sender ? duel.to : duel.from).split('@')[0]}.`;
    await sock.sendMessage(msg.key.remoteJid, { text: rejectionMessage, mentions: [duel.from, duel.to] });
  }
};

export default duelCommand;