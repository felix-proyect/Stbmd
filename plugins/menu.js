import { readSettingsDb } from '../lib/database.js'

// 🔱 Mapa de emojis de categorías
const categoryEmojis = {
  'rpg': '⚔️', 'general': '🔱', 'descargas': '🌊', 'diversion': '🐟', 'juegos': '🎮',
  'grupos': '👥', 'propietario': '👑', 'herramientas': '🛠️', 'informacion': '📚',
  'sub-bots': '🤖', 'ia': '🧠', 'otros': '⚙️', 'anime': '🌸', 'musica': '🎧',
  'nsfw': '🚫', 'economia': '💰', 'stickers': '🎨', 'moderacion': '🛡️',
  'configuracion': '⚙️', 'utilidades': '📦', 'busquedas': '🔍', 'premium': '💎',
  'fun': '😜', 'texto': '✍️', 'redes': '🌐', 'descargas2': '📥', 'media': '🖼️',
  'administracion': '🧭', 'seguridad': '🧩', 'noticias': '🗞️', 'bot': '🤖', 'otros2': '🌀'
}

// 🌊 Bordes decorativos
const borders = [
  { top: "╭─≈「", mid: "│", bot: "╰≈───≈───≈───≈╯" },
  { top: "┌─🦈", mid: "│", bot: "└───────────🦈" },
  { top: "╭🌊", mid: "┃", bot: "╰🌊────────🌊" },
  { top: "╒═🫧", mid: "│", bot: "╘════════🫧" },
  { top: "┏━━🌸", mid: "┃", bot: "┗━━━━━━━━🌸" },
  { top: "╭══💙", mid: "║", bot: "╰════════💙" },
  { top: "╒═⚔️", mid: "│", bot: "╘═════════⚔️" },
  { top: "┏━🩵", mid: "┃", bot: "┗━━━━━━━━🩵" },
  { top: "╔═🌙", mid: "║", bot: "╚═════════🌙" },
  { top: "╭──🌊", mid: "│", bot: "╰───────🌊" }
]

// 🎬 URLs de los videos disponibles
const videos = [
  'https://github.com/Andresv27728/dtbs/raw/main/xzadonix_49.mp4',
  'https://files.catbox.moe/ia78ce.mp4'
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

    const settings = readSettingsDb()
    const groupSettings = settings[from] || {}
    const isRpgDisabled = from.endsWith('@g.us') && groupSettings.rpgEnabled === false

    // 🩵 Borde aleatorio
    const border = borders[Math.floor(Math.random() * borders.length)]

    // Agrupar comandos
    commands.forEach(command => {
      if (!command.category || command.name === 'test') return
      if (isRpgDisabled && command.category === 'rpg') return
      const category = command.category.toLowerCase()
      if (!categories[category]) categories[category] = []
      categories[category].push(command)
    })

    const sortedCategories = Object.keys(categories).sort()

    // 💬 Construir el texto del menú
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

    // 🎞️ Elegir un video aleatorio
    const chosen = Math.floor(Math.random() * videos.length)
    const primaryVideo = videos[chosen]
    const backupVideo = videos[1 - chosen] // el otro video

    // 🔁 Intentar enviar video principal, y si falla, usar respaldo
    try {
      await sock.sendMessage(from, {
        video: { url: primaryVideo },
        caption: menuText,
        mimetype: 'video/mp4',
        gifPlayback: false
      }, { quoted: msg })
    } catch (err) {
      console.error('⚠️ Error enviando video principal:', err)
      await sock.sendMessage(from, {
        video: { url: backupVideo },
        caption: menuText,
        mimetype: 'video/mp4',
        gifPlayback: false
      }, { quoted: msg })
    }
  }
}

export default menuCommand
