import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import fetch, { Blob } from 'node-fetch'

// === FIX file-type ===
let fileTypeFromBuffer
try {
  const fileType = await import('file-type')
  fileTypeFromBuffer = fileType.fileTypeFromBuffer || fileType.default?.fileTypeFromBuffer
} catch {
  fileTypeFromBuffer = async () => null
}

// === FUNCIONES DE SUBIDA ===

// 🐱 Catbox
async function uploadCatbox(buffer, ext, mime) {
  try {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    const name = crypto.randomBytes(6).toString('hex')
    form.append('fileToUpload', new Blob([buffer], { type: mime }), `${name}.${ext}`)
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
    const url = (await res.text()).trim()
    return url.startsWith('http') ? url : null
  } catch {
    return null
  }
}

// 📁 File.io
async function uploadFileIo(buffer, ext, mime) {
  try {
    const form = new FormData()
    const name = `upload.${ext}`
    form.append('file', new Blob([buffer], { type: mime }), name)
    const res = await fetch('https://file.io', { method: 'POST', body: form })
    const json = await res.json()
    return json.success ? json.link : null
  } catch {
    return null
  }
}

// 💨 Uguu.se
async function uploadUguu(buffer, ext, mime) {
  try {
    const form = new FormData()
    const name = `upload.${ext}`
    form.append('file', new Blob([buffer], { type: mime }), name)
    const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: form })
    const json = await res.json()
    return json.files?.[0]?.url || null
  } catch {
    return null
  }
}

// === FUNCION PRINCIPAL DE SUBIDA ===
async function uploadToAny(buffer, ext, mime) {
  const services = [
    { fn: uploadCatbox, name: "Catbox" },
    { fn: uploadFileIo, name: "File.io" },
    { fn: uploadUguu, name: "Uguu.se" }
  ]

  for (const s of services) {
    try {
      const url = await s.fn(buffer, ext, mime)
      if (url && url.startsWith('http')) {
        console.log(`[tourl] ✅ Subido correctamente en: ${s.name} → ${url}`)
        return url
      }
    } catch (e) {
      console.log(`[tourl] ❌ Falló en ${s.name}:`, e.message)
    }
  }

  return null
}

// === COMANDO PRINCIPAL ===
const tourlCommand = {
  name: "tourl",
  category: "utilidades",
  description: "Sube un archivo (imagen, video, etc.) a múltiples servidores y genera un enlace público.",
  aliases: ["up"],

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted) {
      return sock.sendMessage(from, { text: "Responde a una imagen, video o documento para subirlo." }, { quoted: msg })
    }

    const messageType = Object.keys(quoted)[0]
    const mediaMessage = quoted[messageType]
    const mediaType = messageType.replace('Message', '')

    if (!mediaMessage) {
      return sock.sendMessage(from, { text: "El mensaje citado no contiene un archivo válido." }, { quoted: msg })
    }

    const waitingMsg = await sock.sendMessage(from, { text: "📤 Subiendo archivo..." }, { quoted: msg })
    let tempFilePath = ''

    try {
      const stream = await downloadContentFromMessage(mediaMessage, mediaType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      const tempDir = './temp'
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
      const extension = mediaMessage.mimetype.split('/')[1] || 'bin'
      tempFilePath = path.join(tempDir, `${Date.now()}.${extension}`)
      fs.writeFileSync(tempFilePath, buffer)

      let { ext, mime } = { ext: extension, mime: mediaMessage.mimetype }
      try {
        const typeInfo = await fileTypeFromBuffer(buffer)
        if (typeInfo?.ext) ext = typeInfo.ext
        if (typeInfo?.mime) mime = typeInfo.mime
      } catch {}

      const url = await uploadToAny(buffer, ext, mime)
      if (!url) throw new Error("No se pudo subir el archivo a ningún servidor.")

      const caption = `✅ *Archivo Subido Exitosamente*\n\n🌐 *URL:* ${url}`
      await sock.sendMessage(from, { text: caption }, { quoted: msg, edit: waitingMsg.key })

    } catch (e) {
      console.error("Error en tourl:", e)
      await sock.sendMessage(from, { text: "❌ Ocurrió un error al subir el archivo." }, { quoted: msg, edit: waitingMsg.key })
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
    }
  }
}

export default tourlCommand
