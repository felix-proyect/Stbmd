import { readSettingsDb } from '../lib/database.js'

// 🔱 Mapa de emojis de categorías base
const baseCategoryEmojis = {
  'rpg': ['⚔️', '🛡️', '🏹', '🗡️', '🐉', '⚒️'],
  'general': ['🔱', '🌊', '🦈', '🐚', '🪸'],
  'descargas': ['📥', '💾', '🌀', '📦', '🌐'],
  'diversion': ['🐟', '🤣', '🎉', '🎊', '🫧'],
  'juegos': ['🎮', '🕹️', '👾', '🏆', '💥'],
  'grupos': ['👥', '🗣️', '💬', '📢', '👑'],
  'propietario': ['👑', '💼', '🌟', '⚡', '🪙'],
  'herramientas': ['🛠️', '🔧', '⚙️', '🪛', '🔩'],
  'informacion': ['📚', '🧭', '📖', '💡', '🧠'],
  'sub-bots': ['🤖', '🧩', '⚙️', '💠', '🪄'],
  'ia': ['🧠', '🤖', '💫', '🌐', '🌀'],
  'anime': ['🌸', '🍥', '🩷', '💫', '✨'],
  'musica': ['🎧', '🎵', '🎶', '🎤', '💿'],
  'economia': ['💰', '💸', '🏦', '🪙', '📈'],
  'moderacion': ['🛡️', '🚨', '⚔️', '📛', '🔰'],
  'premium': ['💎', '🌟', '👑', '✨', '💠'],
  'stickers': ['🎨', '🖌️', '🌈', '💫', '🩵'],
  'bot': ['🤖', '💠', '🔮', '🪩', '🌐']
}

// 💎 Más de 150 decoraciones randomizadas
const borders = [
  // Estilo oceánico 🌊
  { top: "╭──🌊──╮", mid: "│", bot: "╰──🌊──╯" },
  { top: "┌🌊⋆｡˚🫧˚｡⋆🌊┐", mid: "┃", bot: "└🌊⋆｡˚🫧˚｡⋆🌊┘" },
  { top: "╒═🌊═╕", mid: "║", bot: "╘═🌊═╛" },
  { top: "╭═🫧═══🌊═══🫧═╮", mid: "┃", bot: "╰═🫧═══🌊═══🫧═╯" },
  { top: "┏━━━🦈━━━┓", mid: "┃", bot: "┗━━━🦈━━━┛" },

  // Estilo cute 💖
  { top: "♡⋆｡˚💙˚｡⋆♡", mid: "♡", bot: "♡⋆｡˚💙˚｡⋆♡" },
  { top: "╭♡❀🐚❀♡╮", mid: "│", bot: "╰♡❀🐚❀♡╯" },
  { top: "♡🌸✿🌷🌸♡", mid: "│", bot: "♡🌸✿🌷🌸♡" },
  { top: "✧･ﾟ: *✧･ﾟ:*💫*:･ﾟ✧*:･ﾟ✧", mid: "│", bot: "✧･ﾟ: *✧･ﾟ:*💫*:･ﾟ✧*:･ﾟ✧" },

  // Estilo gamer 🎮
  { top: "╭🎮⚡", mid: "│", bot: "╰⚡🎮" },
  { top: "┌👾 GAME 👾┐", mid: "│", bot: "└👾 GAME 👾┘" },
  { top: "╒═💥═╕", mid: "│", bot: "╘═💥═╛" },
  { top: "╭🕹️═══🎮═══🕹️╮", mid: "┃", bot: "╰🕹️═══🎮═══🕹️╯" },

  // Estilo Gura 🦈 (temático)
  { top: "╭═══『GURA🌊』═══╮", mid: "│", bot: "╰═══『🦈』═══╯" },
  { top: "┌─🦈ATLANTIS🫧─┐", mid: "│", bot: "└─🌊SEA SYSTEM─┘" },
  { top: "╭🫧✨🌊✨🫧╮", mid: "┃", bot: "╰🫧✨🌊✨🫧╯" },
  { top: "╒═🌊💙GURA💙🌊═╕", mid: "│", bot: "╘═🌊💙GURA💙🌊═╛" },

  // Estilo japonés 🗾
  { top: "╭─⛩️───🌸───⛩️─╮", mid: "│", bot: "╰─⛩️───🌸───⛩️─╯" },
  { top: "┏━━🌸日本🌸━━┓", mid: "┃", bot: "┗━━🌸日本🌸━━┛" },
  { top: "╒═桜═╕", mid: "│", bot: "╘═桜═╛" },
  { top: "╭🌸─🌸─🌸─╮", mid: "│", bot: "╰🌸─🌸─🌸─╯" },

  // Minimalistas ⚪
  { top: "╭──────────╮", mid: "│", bot: "╰──────────╯" },
  { top: "┌────────────┐", mid: "│", bot: "└────────────┘" },
  { top: "╒═════════╕", mid: "│", bot: "╘═════════╛" },
  { top: "╭⋆｡˚🫧˚｡⋆╮", mid: "│", bot: "╰⋆｡˚🫧˚｡⋆╯" },
  { top: "┏━━━━━━━┓", mid: "┃", bot: "┗━━━━━━━┛" },

  // Futuristas 🌐
  { top: "╭◇NEON◇╮", mid: "│", bot: "╰◇NEON◇╯" },
  { top: "┌⚡HYPER⚡┐", mid: "│", bot: "└⚡CORE⚡┘" },
  { top: "╒═💠CYBER💠═╕", mid: "│", bot: "╘═💠SPACE💠═╛" },
  { top: "╭═🌐═══💫═══🌐═╮", mid: "┃", bot: "╰═🌐═══💫═══🌐═╯" }
]

// ⚙️ Generar decoraciones aleatorias (más de 150)
for (let i = 0; i < 130; i++) {
  const randomEmoji = ["🌊", "🫧", "🦈", "💙", "✨", "🐚", "💫", "🧜‍♀️", "⚙️", "🌀"][Math.floor(Math.random() * 10)]
  borders.push({
    top: `╭═══${randomEmoji.repeat(Math.floor(Math.random() * 3) + 2)}═══╮`,
    mid: "│",
    bot: `╰═══${randomEmoji.repeat(Math.floor(Math.random() * 3) + 2)}═══╯`
  })
}

// 🎬 URLs de los videos disponibles
const videos = [
  'https://github.com/Andresv27728/dtbs/blob/main/SSYouTube.online_blue%20horizon!!%20-%20Gawr%20Gura_1080p.mp4',
  'https://files.catbox.moe/ia78ce.mp4'
]

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot con decoraciones aleatorias Gura.",
  aliases: ["help", "menú"],

  async execute({ sock, msg, commands, config }) {
    const senderName = msg.pushName || 'Chumbie'
    const from = msg.key.remoteJid
    const settings = readSettingsDb()
    const groupSettings = settings[from] || {}
    const isRpgDisabled = from.endsWith('@g.us') && groupSettings.rpgEnabled === false

    const border = borders[Math.floor(Math.random() * borders.length)]
    const categories = {}

    commands.forEach(command => {
      if (!command.category || command.name === 'test') return
      if (isRpgDisabled && command.category === 'rpg') return
      const cat = command.category.toLowerCase()
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(command)
    })

    const sorted = Object.keys(categories).sort()

    let menuText = `${border.top}\n${border.mid} 💙 *GURA BOT MENU* 💙\n${border.mid} Usuario: *${senderName}*\n${border.mid} Bot: *${config.botName}*\n${border.mid} Creador: *${config.ownerName}*\n${border.bot}\n\n`

    for (const category of sorted) {
      const emojiList = baseCategoryEmojis[category] || ['⚙️']
      const emoji = emojiList[Math.floor(Math.random() * emojiList.length)]
      const cmds = categories[category]
        .filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i)
        .map(c => `${border.mid} ⤷ ${c.name}`)
        .join('\n')
      menuText += `${border.top}\n${border.mid} ${emoji} *${category.toUpperCase()}*\n${cmds}\n${border.bot}\n\n`
    }

    menuText += `${border.top}\n${border.mid} 🌊 *ATLANTIS SYSTEM* 🌊\n${border.mid} Gracias por usar a Gura, *${senderName}* 💙\n${border.mid} ¡Sumérgete en las olas del código!\n${border.bot}`

    const vid = videos[Math.floor(Math.random() * videos.length)]
    try {
      await sock.sendMessage(from, {
        video: { url: vid },
        caption: menuText,
        mimetype: 'video/mp4'
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: menuText }, { quoted: msg })
    }
  }
}

export default menuCommand
