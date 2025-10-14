import { readSettingsDb } from '../lib/database.js'

// 🔱 Mapa de emojis para las categorías temático de Gura
const categoryEmojis = {
  'rpg': '⚔️',
  'general': '🔱',
  'descargas': '🌊',
  'diversion': '🐟',
  'juegos': '🎮',
  'grupos': '👥',
  'propietario': '👑',
  'herramientas': '🛠️',
  'informacion': '📚',
  'sub-bots': '🤖',
  'ia': '🧠',
  'otros': '⚙️',
  'anime': '🌸',
  'musica': '🎧',
  'nsfw': '🚫',
  'economia': '💰',
  'stickers': '🎨',
  'moderacion': '🛡️',
  'configuracion': '⚙️',
  'utilidades': '📦',
  'busquedas': '🔍',
  'premium': '💎',
  'fun': '😜',
  'texto': '✍️',
  'redes': '🌐',
  'descargas2': '📥',
  'media': '🖼️',
  'administracion': '🧭',
  'seguridad': '🧩',
  'noticias': '🗞️',
  'bot': '🤖',
  'otros2': '🌀'
}

// 🌊 Estilos de bordes temáticos de Gura (35 en total)
const borders = [
  { top: "╭─≈「", mid: "│", bot: "╰≈───≈───≈───≈╯" },
  { top: "╔═▷", mid: "║", bot: "╚═════════════▷" },
  { top: "┌─🦈", mid: "│", bot: "└───────────🦈" },
  { top: "╭┈➤", mid: "│", bot: "╰───────────➤" },
  { top: "┏~～", mid: "┃", bot: "┗~～~～~～~～~～┛" },
  { top: "✦━─┄", mid: "┃", bot: "┗━━━━━━✦" },
  { top: "╭🌊", mid: "┃", bot: "╰🌊────────🌊" },
  { top: "┎━━💫", mid: "┃", bot: "┖━━━━━━💫" },
  { top: "╒═🫧", mid: "│", bot: "╘════════🫧" },
  { top: "┏━━🌸", mid: "┃", bot: "┗━━━━━━━━🌸" },
  { top: "╭⚓", mid: "│", bot: "╰⚓──────────" },
  { top: "╭══💙", mid: "║", bot: "╰════════💙" },
  { top: "╒═⚔️", mid: "│", bot: "╘═════════⚔️" },
  { top: "┌─🎐", mid: "│", bot: "└────────🎐" },
  { top: "┏━🩵", mid: "┃", bot: "┗━━━━━━━━🩵" },
  { top: "╔═🌙", mid: "║", bot: "╚═════════🌙" },
  { top: "╭──🌊", mid: "│", bot: "╰───────🌊" },
  { top: "┎━━✨", mid: "┃", bot: "┖━━━━━━✨" },
  { top: "╭~💫", mid: "│", bot: "╰~💫~~~~~~~~" },
  { top: "┏★", mid: "┃", bot: "┗★━━━━━━━" },
  { top: "╔══🌊", mid: "║", bot: "╚════════🌊" },
  { top: "┏💎", mid: "┃", bot: "┗💎━━━━━━" },
  { top: "╭🎮", mid: "│", bot: "╰────────🎮" },
  { top: "┎━━📚", mid: "┃", bot: "┖━━━━━━📚" },
  { top: "╭⚙️", mid: "│", bot: "╰⚙️────────" },
  { top: "╒═🧠", mid: "│", bot: "╘════════🧠" },
  { top: "┏━👑", mid: "┃", bot: "┗━━━━━━👑" },
  { top: "╭🌐", mid: "│", bot: "╰────────🌐" },
  { top: "╔═💫", mid: "║", bot: "╚════════💫" },
  { top: "┏🌸", mid: "┃", bot: "┗🌸━━━━━━" },
  { top: "╭🧭", mid: "│", bot: "╰────────🧭" },
  { top: "┏✨", mid: "┃", bot: "┗━━━━━━✨" },
  { top: "╔═🦈", mid: "║", bot: "╚════════🦈" },
  { top: "╭─💎", mid: "│", bot: "╰────────💎" },
  { top: "┏━🌊", mid: "┃", bot: "┗━━━━━━🌊" }
]

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot.",
  aliases: ["help", "menu", "menú"],

  async execute({ sock, msg, commands, config }) {
    const categories = {}
    const senderName = msg.pushName || 'Chumbie'
    const from = msg.key.remoteJid

    // --- Verificación de RPG activado ---
    const settings = readSettingsDb()
    const groupSettings = settings[from] || {}
    const isRpgDisabled = from.endsWith('@g.us') && groupSettings.rpgEnabled === false

    // 🔀 Elegir un estilo aleatorio
    const border = borders[Math.floor(Math.random() * borders.length)]

    // Agrupar comandos por categoría
    commands.forEach(command => {
      if (!command.category || command.name === 'test') return
      if (isRpgDisabled && command.category === 'rpg') return
      const category = command.category.toLowerCase()
      if (!categories[category]) categories[category] = []
      categories[category].push(command)
    })

    // Ordenar categorías
    const sortedCategories = Object.keys(categories).sort()

    // 🔱 --- Construcción del menú ---
    let menuText = `${border.top} *GURA BOT* 🔱』\n`
    menuText += `${border.mid} Hey, *${senderName}*!\n`
    menuText += `${border.mid} Bot: *${config.botName}*\n`
    menuText += `${border.mid} Creador: *${config.ownerName}*\n`
    menuText += `${border.bot}\n\n`

    for (const category of sortedCategories) {
      const emoji = categoryEmojis[category] || '⚙️'
      menuText += `${border.top} ${emoji} *${category.toUpperCase()}* 』\n`
      const commandList = categories[category]
        .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index)
        .map(cmd => `${border.mid} ⤷ ${cmd.name}`)
        .join('\n')
      menuText += `${commandList}\n${border.bot}\n\n`
    }

    menuText += `${border.top} 🌊 *ATLANTIS SYSTEM* 🌊 』\n`
    menuText += `${border.mid} Gracias por usarme, *${senderName}* 💙\n`
    menuText += `${border.mid} Sumérgete con Gura en las olas del código.\n`
    menuText += `${border.bot}`

    // 🎬 Enviar video decorativo
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        video: { url: 'https://files.catbox.moe/ia78ce.mp4' },
        caption: menuText,
        mimetype: 'video/mp4',
        gifPlayback: false
      },
      { quoted: msg }
    )
  }
}

export default menuCommand
