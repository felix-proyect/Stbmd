import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import fetch, { Blob } from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'

// === FUNCIONES DE SUBIDA ===

// CDNMEGA
async function uploadToCdnmega(filePath) {
  try {
    const formData = new FormData()
    formData.append("file", fs.createReadStream(filePath))

    const response = await axios.post("https://cdnmega.vercel.app/upload", formData, {
      headers: { ...formData.getHeaders() }
    })

    const result = response.data
    return result.success ? result.files[0]?.url : null
  } catch (e) {
    return null
  }
}

// CATBOX
async function uploadCatbox(buffer, ext, mime) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  const randomBytes = crypto.randomBytes(5).toString('hex')
  form.append('fileToUpload', new Blob([buffer], { type: mime || 'application/octet-stream' }), `${randomBytes}.${ext || 'bin'}`)
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
  return (await res.text()).trim()
}

// POSTIMAGES
async function uploadPostImages(buffer, ext, mime) {
  const form = new FormData()
  form.append('optsize', '0')
  form.append('expire', '0')
  form.append('numfiles', '1')
  form.append('upload_session', String(Math.random()))
  form.append('file', new Blob([buffer], { type: mime || 'image/jpeg' }), `${Date.now()}.${ext || 'jpg'}`)
  const res = await fetch('https://postimages.org/json/rr', { method: 'POST', body: form })
  const json = await res.json().catch(async () => ({ raw: await res.text() }))
  return json?.url || json?.images?.[0]?.url || null
}

// LITTERBOX
async function uploadLitterbox(buffer, ext, mime) {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mime || 'application/octet-stream' }), `upload.${ext || 'bin'}`)
  form.append('time', '24h')
  const res = await fetch('https://api.alvianuxio.eu.org/uploader/litterbox', { method: 'POST', body: form })
  const text = await res.text()
  try { const j = JSON.parse(text); return j.url || j.data?.url || null } catch { return /https?:\/\/[\w./-]+/i.test(text) ? text.trim() : null }
}

// TMPFILES
async function uploadTmpFiles(buffer, ext, mime) {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mime || 'application/octet-stream' }), `upload.${ext || 'bin'}`)
  const res = await fetch('https://api.alvianuxio.eu.org/uploader/tmpfiles', { method: 'POST', body: form })
  const text = await res.text()
  try { const j = JSON.parse(text); return j.url || j.data?.url || j.link || null } catch { return /https?:\/\/[\w./-]+/i.test(text) ? text.trim() : null }
}

// FREEIMAGEHOST
async function uploadFreeImageHost(buffer, ext, mime) {
  const form = new FormData()
  form.append('key', '6d207e02198a847aa98d0a2a901485a5')
  form.append('action', 'upload')
  form.append('source', new Blob([buffer], { type: mime || 'image/jpeg' }), `upload.${ext || 'jpg'}`)
  const res = await fetch('https://freeimage.host/api/1/upload', { method: 'POST', body: form })
  const j = await res.json().catch(async () => ({ raw: await res.text() }))
  return j?.image?.url || j?.data?.image?.url || null
}

// === SUBIR A VARIOS SERVICIOS Y DEVOLVER EL PRIMERO ===
async function uploadToAny(buffer, filePath, ext, mime) {
  const services = [
    async () => await uploadToCdnmega(filePath),
    async () => await uploadCatbox(buffer, ext, mime),
    async () => await uploadPostImages(buffer, ext, mime),
    async () => await uploadLitterbox(buffer, ext, mime),
    async () => await uploadTmpFiles(buffer, ext, mime),
    async () => await uploadFreeImageHost(buffer, ext, mime)
  ]

  for (const upload of services) {
    try {
      const url = await upload()
      if (url && url.startsWith('http')) return url
    } catch {}
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

    const waitingMsg = await sock.sendMessage(from, { text: "📤 Subiendo archivo a múltiples servidores..." }, { quoted: msg })
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

      const { ext, mime } = (await fileTypeFromBuffer(buffer)) || { ext: extension, mime: mediaMessage.mimetype }

      // Subir al primer servicio disponible
      const url = await uploadToAny(buffer, tempFilePath, ext, mime)
      if (!url) throw new Error("No se pudo subir el archivo a ningún servidor.")

      const caption = `✅ *Archivo Subido Exitosamente*\n\n📎 *URL:* ${url}`
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
